import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticate, authorize, verifyOrganizationAccess } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize('SUPER_ADMIN'));
router.use(verifyOrganizationAccess);

router.get('/dashboard', (req, res) => {
  const orgId = req.targetOrganizationId;
  const today = new Date().toISOString().split('T')[0];
  const targetDate = req.query.date || today;

  const totalEmployees = db.count('users', u => u.organization_id === orgId && u.role === 'EMPLOYEE');
  const confirmedToday = db.count('lunch_attendance', a => {
    const user = db.find('users', u => u.id === a.user_id);
    return user && user.organization_id === orgId && a.date === targetDate && a.status === 'confirmed';
  });
  const declinedToday = db.count('lunch_attendance', a => {
    const user = db.find('users', u => u.id === a.user_id);
    return user && user.organization_id === orgId && a.date === targetDate && a.status === 'declined';
  });
  const noResponse = Math.max(0, totalEmployees - confirmedToday - declinedToday);
  const org = db.find('organizations', o => o.id === orgId);

  res.json({ totalEmployees, confirmedToday, declinedToday, noResponse, date: targetDate, cutoff: { hour: org?.lunch_cutoff_hour ?? 10, minute: org?.lunch_cutoff_minute ?? 30 } });
});

router.get('/dashboard/weekly', (req, res) => {
  const orgId = req.targetOrganizationId;
  const employees = db.filter('users', u => u.organization_id === orgId && u.role === 'EMPLOYEE');
  const empIds = new Set(employees.map(e => e.id));

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  const weeklyData = days.map(date => {
    const dayRecords = db.filter('lunch_attendance', a => empIds.has(a.user_id) && a.date === date);
    const confirmed = dayRecords.filter(a => a.status === 'confirmed').length;
    const declined = dayRecords.filter(a => a.status === 'declined').length;
    const pending = Math.max(0, employees.length - confirmed - declined);
    const dayLabel = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    return { day: dayLabel, confirmed, declined, pending };
  });

  res.json({ weeklyData, totalEmployees: employees.length });
});

router.get('/dashboard/reminders', (req, res) => {
  const orgId = req.targetOrganizationId;
  const today = new Date().toISOString().split('T')[0];
  const employees = db.filter('users', u => u.organization_id === orgId && u.role === 'EMPLOYEE');

  const noResponseEmps = employees.filter(emp => {
    const att = db.find('lunch_attendance', a => a.user_id === emp.id && a.date === today);
    return !att;
  });

  res.json({
    count: noResponseEmps.length,
    employees: noResponseEmps.map(e => ({ id: e.id, name: e.name, email: e.email })),
  });
});

router.post('/dashboard/reminders', (req, res) => {
  const orgId = req.targetOrganizationId;
  const today = new Date().toISOString().split('T')[0];
  const { employeeIds } = req.body;

  const employees = db.filter('users', u => u.organization_id === orgId && u.role === 'EMPLOYEE');
  let targets = employees;

  if (employeeIds && employeeIds.length > 0) {
    targets = employees.filter(e => employeeIds.includes(e.id));
  }

  const noResponseEmps = targets.filter(emp => {
    const att = db.find('lunch_attendance', a => a.user_id === emp.id && a.date === today);
    return !att;
  });

  noResponseEmps.forEach(emp => {
    db.auditLog(req.user.id, 'reminder_sent', 'user', emp.id, { date: today });
  });

  res.json({ sent: noResponseEmps.length, message: `Reminder sent to ${noResponseEmps.length} employee(s)` });
});

const ROLES = ['EMPLOYEE', 'RESTAURANT_MANAGER', 'SUPER_ADMIN'];

// Roster of everyone in the organization (all roles), for team + access management.
router.get('/employees', (req, res) => {
  const orgId = req.targetOrganizationId;
  const { search, department, role, page = 1, limit = 20 } = req.query;

  let members = db.filter('users', u => u.organization_id === orgId);

  if (search) {
    const s = search.toLowerCase();
    members = members.filter(u => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || (u.employee_number && u.employee_number.toLowerCase().includes(s)));
  }
  if (department) {
    members = members.filter(u => u.department === department);
  }
  if (role) {
    members = members.filter(u => u.role === role);
  }

  members.sort((a, b) => a.name.localeCompare(b.name));
  const total = members.length;
  const offset = (page - 1) * limit;
  const paged = members.slice(offset, offset + Number(limit));

  res.json({
    employees: paged.map(e => ({
      id: e.id, email: e.email, name: e.name, role: e.role,
      employee_number: e.employee_number, department: e.department,
      restaurant_id: e.restaurant_id, created_at: e.created_at,
    })),
    pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

// Change a member's role. SUPER_ADMIN only (route is already gated).
router.put('/employees/:employeeId/role', (req, res) => {
  const orgId = req.targetOrganizationId;
  const { role } = req.body;

  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const target = db.find('users', u => u.id === req.params.employeeId && u.organization_id === orgId);
  if (!target) return res.status(404).json({ error: 'Member not found' });

  if (target.id === req.user.id) {
    return res.status(400).json({ error: "You can't change your own role" });
  }

  if (target.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
    const admins = db.count('users', u => u.organization_id === orgId && u.role === 'SUPER_ADMIN');
    if (admins <= 1) return res.status(400).json({ error: 'There must be at least one admin' });
  }

  const updates = { role };
  if (role === 'RESTAURANT_MANAGER') {
    const link = db.find('restaurant_organizations', ro => ro.organization_id === orgId);
    updates.restaurant_id = target.restaurant_id || link?.restaurant_id || null;
  } else {
    updates.restaurant_id = null;
  }

  db.update('users', u => u.id === target.id, updates);
  db.auditLog(req.user.id, 'role_changed', 'user', target.id, { email: target.email, from: target.role, to: role });

  res.json({ id: target.id, name: target.name, email: target.email, role, restaurant_id: updates.restaurant_id });
});

router.get('/employees/:employeeId', (req, res) => {
  const orgId = req.targetOrganizationId;
  const emp = db.find('users', u => u.id === req.params.employeeId && u.organization_id === orgId && u.role === 'EMPLOYEE');
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  res.json({ id: emp.id, email: emp.email, name: emp.name, employee_number: emp.employee_number, department: emp.department, created_at: emp.created_at });
});

router.post('/employees', (req, res) => {
  const orgId = req.targetOrganizationId;
  const { name, email, employee_number, department } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
  if (db.find('users', u => u.email === email)) return res.status(409).json({ error: 'Email already exists' });

  const emp = { id: uuidv4(), email, name, role: 'EMPLOYEE', organization_id: orgId, restaurant_id: null, employee_number: employee_number || null, department: department || null, created_at: new Date().toISOString() };
  db.insert('users', emp);
  db.auditLog(req.user.id, 'employee_created', 'user', emp.id, { name, email, department });
  res.status(201).json({ id: emp.id, name, email, employee_number, department });
});

router.put('/employees/:employeeId', (req, res) => {
  const orgId = req.targetOrganizationId;
  const emp = db.find('users', u => u.id === req.params.employeeId && u.organization_id === orgId);
  if (!emp) return res.status(404).json({ error: 'Member not found' });

  const { name, email, employee_number, department } = req.body;
  if (email && email !== emp.email) {
    if (db.find('users', u => u.email === email && u.id !== emp.id)) return res.status(409).json({ error: 'Email already in use' });
    emp.email = email;
  }
  if (name) emp.name = name;
  if (employee_number !== undefined) emp.employee_number = employee_number;
  if (department !== undefined) emp.department = department;

  db.auditLog(req.user.id, 'employee_updated', 'user', emp.id, { name, email, department });
  res.json({ message: 'Employee updated' });
});

router.delete('/employees/:employeeId', (req, res) => {
  const orgId = req.targetOrganizationId;
  const emp = db.find('users', u => u.id === req.params.employeeId && u.organization_id === orgId);
  if (!emp) return res.status(404).json({ error: 'Member not found' });

  if (emp.id === req.user.id) {
    return res.status(400).json({ error: "You can't remove your own account" });
  }
  if (emp.role === 'SUPER_ADMIN') {
    const admins = db.count('users', u => u.organization_id === orgId && u.role === 'SUPER_ADMIN');
    if (admins <= 1) return res.status(400).json({ error: 'There must be at least one admin' });
  }

  db.remove('lunch_attendance', a => a.user_id === emp.id);
  db.remove('users', u => u.id === emp.id);
  db.auditLog(req.user.id, 'employee_deleted', 'user', emp.id, { name: emp.name, email: emp.email });
  res.json({ message: 'Employee deleted' });
});

router.get('/departments', (req, res) => {
  const orgId = req.targetOrganizationId;
  const departments = [...new Set(
    db.filter('users', u => u.organization_id === orgId && u.role === 'EMPLOYEE' && u.department).map(u => u.department)
  )].sort();
  res.json(departments);
});

router.get('/attendance', (req, res) => {
  const orgId = req.targetOrganizationId;
  const { date, status, page = 1, limit = 20 } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  const employees = db.filter('users', u => u.organization_id === orgId && u.role === 'EMPLOYEE');
  let records = employees.map(emp => {
    const att = db.find('lunch_attendance', a => a.user_id === emp.id && a.date === targetDate);
    return { user_id: emp.id, name: emp.name, employee_number: emp.employee_number, department: emp.department, status: att?.status || null, confirmed_at: att?.confirmed_at || null };
  });

  if (status) {
    if (status === 'pending') records = records.filter(r => !r.status);
    else records = records.filter(r => r.status === status);
  }

  const total = records.length;
  const offset = (page - 1) * limit;
  const paged = records.slice(offset, offset + Number(limit));

  res.json({ date: targetDate, records: paged, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) } });
});

router.get('/attendance/history', (req, res) => {
  const orgId = req.targetOrganizationId;
  const { startDate, endDate, page = 1, limit = 20 } = req.query;
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];

  const employees = db.filter('users', u => u.organization_id === orgId && u.role === 'EMPLOYEE');
  const empMap = new Map(employees.map(e => [e.id, e]));
  const records = db.filter('lunch_attendance', a => {
    const emp = empMap.get(a.user_id);
    return emp && a.date >= start && a.date <= end;
  }).map(a => {
    const emp = empMap.get(a.user_id);
    return { name: emp.name, employee_number: emp.employee_number, department: emp.department, date: a.date, status: a.status, confirmed_at: a.confirmed_at };
  }).sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));

  const total = records.length;
  const offset = (page - 1) * limit;
  res.json({ records: records.slice(offset, offset + Number(limit)), pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) } });
});

router.get('/reports/attendance', (req, res) => {
  const orgId = req.targetOrganizationId;
  const { startDate, endDate, department, format } = req.query;
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];

  const employees = db.filter('users', u => u.organization_id === orgId && u.role === 'EMPLOYEE');
  const empMap = new Map(employees.map(e => [e.id, e]));
  let records = db.filter('lunch_attendance', a => {
    const emp = empMap.get(a.user_id);
    return emp && a.date >= start && a.date <= end;
  }).map(a => {
    const emp = empMap.get(a.user_id);
    return { name: emp.name, employee_number: emp.employee_number, department: emp.department, date: a.date, status: a.status, confirmed_at: a.confirmed_at };
  });

  if (department) records = records.filter(r => r.department === department);
  records.sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));

  if (format === 'csv') {
    db.auditLog(req.user.id, 'report_exported', 'report', null, { format: 'csv', startDate: start, endDate: end, recordCount: records.length });
    const escapeCsv = (val) => {
      const str = String(val || '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const header = 'Employee,Employee Number,Department,Date,Status,Confirmation Time\n';
    const rows = records.map(r => [r.name, r.employee_number, r.department, r.date, r.status, r.confirmed_at].map(escapeCsv).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-report-${start}-to-${end}.csv`);
    return res.send(header + rows);
  }

  res.json({ records, dateRange: { start, end } });
});

router.put('/settings', (req, res) => {
  const orgId = req.targetOrganizationId;
  const org = db.find('organizations', o => o.id === orgId);
  const { lunch_cutoff_hour, lunch_cutoff_minute, name } = req.body;
  if (lunch_cutoff_hour != null) org.lunch_cutoff_hour = lunch_cutoff_hour;
  if (lunch_cutoff_minute != null) org.lunch_cutoff_minute = lunch_cutoff_minute;
  if (name) org.name = name;
  db.auditLog(req.user.id, 'settings_updated', 'organization', orgId, { lunch_cutoff_hour, lunch_cutoff_minute, name });
  res.json(org);
});

router.get('/settings', (req, res) => {
  const org = db.find('organizations', o => o.id === req.targetOrganizationId);
  res.json(org);
});

router.get('/restaurants', (req, res) => {
  const orgId = req.targetOrganizationId;
  const links = db.filter('restaurant_organizations', ro => ro.organization_id === orgId);
  const restaurants = links.map(link => {
    const rest = db.find('restaurants', r => r.id === link.restaurant_id);
    if (!rest) return null;
    return { id: rest.id, name: rest.name, pin: rest.pin };
  }).filter(Boolean);
  res.json(restaurants);
});

router.put('/restaurants/:restaurantId/pin', (req, res) => {
  const { restaurantId } = req.params;
  const { pin } = req.body;

  if (!pin || pin.length < 4) {
    return res.status(400).json({ error: 'PIN must be at least 4 digits' });
  }

  const restaurant = db.find('restaurants', r => r.id === restaurantId);
  if (!restaurant) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }

  restaurant.pin = pin;
  db.auditLog(req.user.id, 'restaurant_pin_updated', 'restaurant', restaurantId, { pin });
  res.json({ id: restaurant.id, name: restaurant.name, pin: restaurant.pin });
});

router.get('/audit-logs', (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const logs = db.filter('audit_logs').sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const total = logs.length;
  const offset = (page - 1) * limit;
  const paged = logs.slice(offset, offset + Number(limit));

  const enriched = paged.map(log => {
    const user = db.find('users', u => u.id === log.user_id);
    return { ...log, user_name: user?.name || 'System', user_email: user?.email };
  });

  res.json({ logs: enriched, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) } });
});

export default router;
