import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

/*
 * File-backed data store.
 *
 * The whole dataset lives in memory (fast, synchronous — every route depends on
 * that) and is mirrored to a single JSON file so it survives restarts. Writes are
 * atomic (temp file + rename). A 3s watchdog also flushes changes made by mutating
 * a record object directly, and we flush on shutdown.
 *
 * Set DATA_FILE to relocate it (Docker mounts a volume there). For a small
 * internal app this is enough; swapping in Postgres later only touches this file.
 */

const DATA_FILE = process.env.DATA_FILE
  ? path.resolve(process.env.DATA_FILE)
  : path.resolve(process.cwd(), 'data', 'lunchify.json');

const EMPTY = {
  organizations: [],
  restaurants: [],
  users: [],
  restaurant_organizations: [],
  lunch_attendance: [],
  audit_logs: [],
};

let store = structuredClone(EMPTY);
let lastSerialized = '';

function load() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      store = { ...structuredClone(EMPTY), ...parsed };
      lastSerialized = JSON.stringify(store);
      console.log(`  DB:        ${DATA_FILE} (${store.users.length} users, ${store.lunch_attendance.length} attendance rows)`);
    } else {
      console.log(`  DB:        ${DATA_FILE} (new — will be created)`);
    }
  } catch (err) {
    console.error(`  DB:        failed to read ${DATA_FILE} — starting empty:`, err.message);
    store = structuredClone(EMPTY);
  }
}

function persist() {
  try {
    const serialized = JSON.stringify(store, null, 2);
    if (serialized === lastSerialized) return;
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    const tmp = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tmp, serialized);
    fs.renameSync(tmp, DATA_FILE);
    lastSerialized = serialized;
  } catch (err) {
    console.error('  DB:        persist failed:', err.message);
  }
}

load();

// Catch direct record mutations (routes that do `record.field = value`).
const watchdog = setInterval(persist, 3000);
if (watchdog.unref) watchdog.unref();

for (const signal of ['SIGINT', 'SIGTERM', 'beforeExit']) {
  process.on(signal, () => {
    persist();
    if (signal !== 'beforeExit') process.exit(0);
  });
}

function find(table, predicate) {
  return store[table].find(predicate);
}

function filter(table, predicate) {
  return predicate ? store[table].filter(predicate) : [...store[table]];
}

function insert(table, record) {
  store[table].push(record);
  persist();
  return record;
}

function update(table, predicate, updates) {
  const record = store[table].find(predicate);
  if (record) {
    Object.assign(record, updates);
    persist();
  }
  return record;
}

function remove(table, predicate) {
  const idx = store[table].findIndex(predicate);
  if (idx >= 0) {
    store[table].splice(idx, 1);
    persist();
  }
}

function count(table, predicate) {
  return predicate ? store[table].filter(predicate).length : store[table].length;
}

function auditLog(userId, action, resource, resourceId, details = {}) {
  store.audit_logs.push({
    id: uuidv4(),
    user_id: userId,
    action,
    resource,
    resource_id: resourceId || null,
    details,
    timestamp: new Date().toISOString(),
  });
  persist();
}

export default { find, filter, insert, update, remove, count, store, auditLog, persist, DATA_FILE };
