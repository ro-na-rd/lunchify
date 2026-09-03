import { Router } from 'express';
import db from '../db.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = db.find('users', u => u.email === email);

  if (!user) {
    return res.status(401).json({ error: 'User not found. Contact your administrator.' });
  }

  const token = generateToken(user);
  db.auditLog(user.id, 'login', 'user', user.id, { method: 'email' });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organization_id,
      restaurantId: user.restaurant_id,
    },
  });
});

router.get('/users', (req, res) => {
  const users = db.filter('users').sort((a, b) => {
    const roleOrder = { SUPER_ADMIN: 0, RESTAURANT_MANAGER: 1, EMPLOYEE: 2 };
    return (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3) || a.name.localeCompare(b.name);
  });

  res.json(users.map(u => ({
    id: u.id, email: u.email, name: u.name, role: u.role,
    organization_id: u.organization_id, restaurant_id: u.restaurant_id,
    employee_number: u.employee_number, department: u.department,
  })));
});

router.post('/restaurant-pin', (req, res) => {
  const { pin } = req.body;

  if (!pin) {
    return res.status(400).json({ error: 'PIN is required' });
  }

  const restaurant = db.find('restaurants', r => r.pin === pin);

  if (!restaurant) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }

  db.auditLog(null, 'restaurant_pin_login', 'restaurant', restaurant.id, { pin });

  res.json({
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
    },
  });
});

export default router;
