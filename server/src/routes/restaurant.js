import { Router } from 'express';
import db from '../db.js';
import { authenticate, authorize, verifyRestaurantAccess } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize('restaurant_owner'));
router.use(verifyRestaurantAccess);

function getServedOrgIds(restaurantId) {
  return db.filter('restaurant_organizations', ro => ro.restaurant_id === restaurantId).map(ro => ro.organization_id);
}

router.get('/dashboard', (req, res) => {
  const restaurantId = req.targetRestaurantId;
  const today = new Date().toISOString().split('T')[0];
  const restaurant = db.find('restaurants', r => r.id === restaurantId);
  const servedOrgIds = getServedOrgIds(restaurantId);

  if (servedOrgIds.length === 0) {
    return res.json({ restaurant, expectedMeals: 0, confirmedLunches: 0, notTakingLunch: 0, noResponse: 0, totalEmployees: 0 });
  }

  const employees = db.filter('users', u => servedOrgIds.includes(u.organization_id) && u.role === 'employee');
  const totalEmployees = employees.length;
  const empIds = new Set(employees.map(e => e.id));

  const confirmedLunches = db.count('lunch_attendance', a => empIds.has(a.user_id) && a.date === today && a.status === 'confirmed');
  const notTakingLunch = db.count('lunch_attendance', a => empIds.has(a.user_id) && a.date === today && a.status === 'declined');
  const noResponse = totalEmployees - confirmedLunches - notTakingLunch;

  res.json({ restaurant, expectedMeals: confirmedLunches, confirmedLunches, notTakingLunch, noResponse, totalEmployees });
});

router.get('/meal-requirements', (req, res) => {
  const restaurantId = req.targetRestaurantId;
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const servedOrgIds = getServedOrgIds(restaurantId);

  if (servedOrgIds.length === 0) return res.json({ date: targetDate, requirements: [] });

  const requirements = servedOrgIds.map(orgId => {
    const org = db.find('organizations', o => o.id === orgId);
    const employees = db.filter('users', u => u.organization_id === orgId && u.role === 'employee');
    const empIds = new Set(employees.map(e => e.id));
    const confirmed = db.count('lunch_attendance', a => empIds.has(a.user_id) && a.date === targetDate && a.status === 'confirmed');
    const declined = db.count('lunch_attendance', a => empIds.has(a.user_id) && a.date === targetDate && a.status === 'declined');
    const pending = employees.length - confirmed - declined;
    return { organization_name: org.name, confirmed, declined, pending, total_employees: employees.length };
  });

  res.json({ date: targetDate, requirements });
});

router.get('/trends', (req, res) => {
  const restaurantId = req.targetRestaurantId;
  const { days = 14 } = req.query;
  const servedOrgIds = getServedOrgIds(restaurantId);

  if (servedOrgIds.length === 0) return res.json({ trends: [] });

  const employees = db.filter('users', u => servedOrgIds.includes(u.organization_id) && u.role === 'employee');
  const empIds = new Set(employees.map(e => e.id));
  const attendance = db.filter('lunch_attendance', a => empIds.has(a.user_id));

  const dateMap = {};
  for (const a of attendance) {
    if (!dateMap[a.date]) dateMap[a.date] = { date: a.date, confirmed: 0, declined: 0, pending: 0, total_employees: 0 };
    dateMap[a.date][a.status === 'confirmed' ? 'confirmed' : a.status === 'declined' ? 'declined' : 'pending']++;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number(days));
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const trends = Object.values(dateMap)
    .filter(t => t.date >= cutoffStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(t => {
      const totalOnDate = employees.length;
      return { ...t, total_employees: totalOnDate, pending: totalOnDate - t.confirmed - t.declined };
    });

  res.json({ trends });
});

router.get('/history', (req, res) => {
  const restaurantId = req.targetRestaurantId;
  const { startDate, endDate, page = 1, limit = 20 } = req.query;
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];
  const servedOrgIds = getServedOrgIds(restaurantId);

  if (servedOrgIds.length === 0) return res.json({ records: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });

  const employees = db.filter('users', u => servedOrgIds.includes(u.organization_id) && u.role === 'employee');
  const empIds = new Set(employees.map(e => e.id));
  const attendance = db.filter('lunch_attendance', a => empIds.has(a.user_id) && a.date >= start && a.date <= end);

  const dateMap = {};
  for (const a of attendance) {
    if (!dateMap[a.date]) dateMap[a.date] = { date: a.date, confirmed: 0, declined: 0, pending: 0, total_employees: 0 };
    dateMap[a.date][a.status === 'confirmed' ? 'confirmed' : a.status === 'declined' ? 'declined' : 'pending']++;
  }

  const allDates = Object.values(dateMap)
    .map(t => ({ ...t, total_employees: employees.length, pending: employees.length - t.confirmed - t.declined }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const total = allDates.length;
  const offset = (page - 1) * limit;
  res.json({ records: allDates.slice(offset, offset + Number(limit)), pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) } });
});

router.get('/reports/preparation', (req, res) => {
  const restaurantId = req.targetRestaurantId;
  const { date, format } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const restaurant = db.find('restaurants', r => r.id === restaurantId);
  const servedOrgIds = getServedOrgIds(restaurantId);

  if (servedOrgIds.length === 0) {
    return res.json({ restaurant: restaurant.name, date: targetDate, totalMealsRequired: 0, confirmedLunches: 0, notTakingLunch: 0, noResponse: 0 });
  }

  const employees = db.filter('users', u => servedOrgIds.includes(u.organization_id) && u.role === 'employee');
  const empIds = new Set(employees.map(e => e.id));
  const totalEmployees = employees.length;
  const confirmed = db.count('lunch_attendance', a => empIds.has(a.user_id) && a.date === targetDate && a.status === 'confirmed');
  const declined = db.count('lunch_attendance', a => empIds.has(a.user_id) && a.date === targetDate && a.status === 'declined');
  const noResponse = totalEmployees - confirmed - declined;

  const report = { restaurant: restaurant.name, date: targetDate, totalMealsRequired: confirmed, confirmedLunches: confirmed, notTakingLunch: declined, noResponse };

  if (format === 'csv') {
    const escapeCsv = (val) => {
      const str = String(val || '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const header = 'Metric,Value\n';
    const rows = [
      ['Restaurant', restaurant.name],
      ['Date', targetDate],
      ['Total Meals Required', confirmed],
      ['Confirmed Lunches', confirmed],
      ['Not Taking Lunch', declined],
      ['No Response', noResponse],
    ].map(r => r.map(escapeCsv).join(',')).join('\n');
    db.auditLog(req.user.id, 'report_exported', 'report', null, { format: 'csv', date: targetDate, restaurant: restaurant.name });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=preparation-report-${targetDate}.csv`);
    return res.send(header + rows);
  }

  res.json(report);
});

export default router;
