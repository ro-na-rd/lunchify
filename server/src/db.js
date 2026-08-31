import { v4 as uuidv4 } from 'uuid';

const store = {
  organizations: [],
  restaurants: [],
  users: [],
  restaurant_organizations: [],
  lunch_attendance: [],
  audit_logs: [],
};

function find(table, predicate) {
  return store[table].find(predicate);
}

function filter(table, predicate) {
  return predicate ? store[table].filter(predicate) : [...store[table]];
}

function insert(table, record) {
  store[table].push(record);
  return record;
}

function update(table, predicate, updates) {
  const record = store[table].find(predicate);
  if (record) Object.assign(record, updates);
  return record;
}

function remove(table, predicate) {
  const idx = store[table].findIndex(predicate);
  if (idx >= 0) store[table].splice(idx, 1);
}

function count(table, predicate) {
  return predicate ? store[table].filter(predicate).length : store[table].length;
}

function initSeed() {
  if (store.organizations.length > 0) return;

  const org1 = { id: uuidv4(), name: 'Acme Corp', lunch_cutoff_hour: 10, lunch_cutoff_minute: 30, created_at: new Date().toISOString() };
  const org2 = { id: uuidv4(), name: 'TechStart Inc', lunch_cutoff_hour: 11, lunch_cutoff_minute: 0, created_at: new Date().toISOString() };
  store.organizations.push(org1, org2);

  const rest1 = { id: uuidv4(), name: 'City Cafe', created_at: new Date().toISOString() };
  const rest2 = { id: uuidv4(), name: 'Urban Bistro', created_at: new Date().toISOString() };
  store.restaurants.push(rest1, rest2);

  store.restaurant_organizations.push(
    { restaurant_id: rest1.id, organization_id: org1.id },
    { restaurant_id: rest2.id, organization_id: org2.id }
  );

  const admin = { id: uuidv4(), email: 'admin@acme.com', name: 'Sarah Johnson', role: 'admin', organization_id: org1.id, restaurant_id: null, employee_number: null, department: null, created_at: new Date().toISOString() };
  const owner1 = { id: uuidv4(), email: 'owner@citycafe.com', name: 'Mike Chen', role: 'restaurant_owner', organization_id: null, restaurant_id: rest1.id, employee_number: null, department: null, created_at: new Date().toISOString() };
  const owner2 = { id: uuidv4(), email: 'owner@urbanbistro.com', name: 'Lisa Park', role: 'restaurant_owner', organization_id: null, restaurant_id: rest2.id, employee_number: null, department: null, created_at: new Date().toISOString() };
  store.users.push(admin, owner1, owner2);

  const employees = [
    { name: 'John Smith', email: 'john@acme.com', dept: 'Engineering' },
    { name: 'Emily Davis', email: 'emily@acme.com', dept: 'Marketing' },
    { name: 'James Wilson', email: 'james@acme.com', dept: 'Sales' },
    { name: 'Maria Garcia', email: 'maria@acme.com', dept: 'HR' },
    { name: 'David Brown', email: 'david@acme.com', dept: 'Finance' },
    { name: 'Jennifer Lee', email: 'jennifer@acme.com', dept: 'Engineering' },
    { name: 'Robert Taylor', email: 'robert@acme.com', dept: 'Operations' },
    { name: 'Amanda White', email: 'amanda@acme.com', dept: 'Marketing' },
    { name: 'Chris Martinez', email: 'chris@acme.com', dept: 'Sales' },
    { name: 'Jessica Anderson', email: 'jessica@acme.com', dept: 'Engineering' },
  ];

  const today = new Date().toISOString().split('T')[0];

  employees.forEach((emp, i) => {
    const empId = uuidv4();
    store.users.push({
      id: empId, email: emp.email, name: emp.name, role: 'employee',
      organization_id: org1.id, restaurant_id: null,
      employee_number: `EMP${String(i + 1).padStart(4, '0')}`, department: emp.dept,
      created_at: new Date().toISOString(),
    });

    const statuses = ['confirmed', 'declined', 'pending'];
    const status = statuses[i % 3];
    if (status !== 'pending') {
      store.lunch_attendance.push({
        id: uuidv4(), user_id: empId, date: today, status,
        confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      });
    }
  });
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
}

initSeed();

export default { find, filter, insert, update, remove, count, store, auditLog };
