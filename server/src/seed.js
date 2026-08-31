import db from './db.js';

export function seed() {
  if (db.store.organizations.length > 0) return;
}

seed();
