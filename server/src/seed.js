import { v4 as uuidv4 } from 'uuid';
import db from './db.js';

/*
 * Seeding.
 *
 *  - seedBaseline(): always runs. Makes sure the app has the minimum it needs to
 *    function — one organization and one restaurant linked to it. Safe to run
 *    every boot; it only fills gaps, never overwrites.
 *  - seedDemo(): only when SEED_DEMO=true and the store is empty. The old
 *    Acme/TechStart sample data, for local demos.
 */

const ORG_NAME = process.env.ORG_NAME || 'Azul Tech';

function randomPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function seedBaseline() {
  let org = db.find('organizations', () => true);
  if (!org) {
    org = {
      id: uuidv4(),
      name: ORG_NAME,
      lunch_cutoff_hour: 10,
      lunch_cutoff_minute: 30,
      created_at: new Date().toISOString(),
    };
    db.insert('organizations', org);
    console.log(`  Seed:      created organization "${org.name}"`);
  }

  const hasRestaurant = db.find('restaurant_organizations', (ro) => ro.organization_id === org.id);
  if (!hasRestaurant) {
    const pin = randomPin();
    const restaurant = {
      id: uuidv4(),
      name: `${ORG_NAME} Kitchen`,
      pin,
      created_at: new Date().toISOString(),
    };
    db.insert('restaurants', restaurant);
    db.insert('restaurant_organizations', {
      restaurant_id: restaurant.id,
      organization_id: org.id,
    });
    console.log(`  Seed:      created restaurant "${restaurant.name}" — kitchen PIN: ${pin} (change it in Admin → Settings)`);
  }
}

function seedDemo() {
  if (process.env.SEED_DEMO !== 'true') return;
  if (db.count('users') > 0) return;

  const org = db.find('organizations', () => true);
  const rest = db.find('restaurants', () => true);

  const admin = { id: uuidv4(), email: 'admin@acme.com', name: 'Sarah Johnson', role: 'SUPER_ADMIN', organization_id: org.id, restaurant_id: null, employee_number: null, department: null, created_at: new Date().toISOString() };
  const manager = { id: uuidv4(), email: 'manager@citycafe.com', name: 'Mike Chen', role: 'RESTAURANT_MANAGER', organization_id: org.id, restaurant_id: rest?.id || null, employee_number: null, department: null, created_at: new Date().toISOString() };
  db.insert('users', admin);
  db.insert('users', manager);

  const employees = [
    { name: 'John Smith', email: 'john@acme.com', dept: 'Engineering' },
    { name: 'Emily Davis', email: 'emily@acme.com', dept: 'Marketing' },
    { name: 'James Wilson', email: 'james@acme.com', dept: 'Sales' },
    { name: 'Maria Garcia', email: 'maria@acme.com', dept: 'HR' },
    { name: 'David Brown', email: 'david@acme.com', dept: 'Finance' },
  ];
  const today = new Date().toISOString().split('T')[0];
  employees.forEach((emp, i) => {
    const empId = uuidv4();
    db.insert('users', {
      id: empId, email: emp.email, name: emp.name, role: 'EMPLOYEE',
      organization_id: org.id, restaurant_id: null,
      employee_number: `EMP${String(i + 1).padStart(4, '0')}`, department: emp.dept,
      created_at: new Date().toISOString(),
    });
    const status = ['confirmed', 'declined', 'pending'][i % 3];
    if (status !== 'pending') {
      db.insert('lunch_attendance', {
        id: uuidv4(), user_id: empId, date: today, status,
        confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      });
    }
  });
  console.log('  Seed:      demo data loaded (SEED_DEMO=true)');
}

export function seed() {
  seedBaseline();
  seedDemo();
}

seed();
