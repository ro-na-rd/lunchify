import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'lunchify-jwt-secret';

const isGoogleConfigured = () => {
  const id = process.env.GOOGLE_CLIENT_ID || '';
  const secret = process.env.GOOGLE_CLIENT_SECRET || '';
  return id && secret && !id.includes('YOUR_GOOGLE') && !secret.includes('YOUR_GOOGLE') && id.length > 10;
};

router.get('/status', (req, res) => {
  res.json({
    googleConfigured: isGoogleConfigured(),
    domain: process.env.ALLOWED_EMAIL_DOMAIN || 'azultech.rw',
    demoMode: !isGoogleConfigured(),
  });
});

router.get('/google', (req, res) => {
  if (!isGoogleConfigured()) {
    return res.redirect(`${FRONTEND_URL}/login?error=google_not_configured`);
  }

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    hd: process.env.ALLOWED_EMAIL_DOMAIN || 'azultech.rw',
    prompt: 'select_account',
  })(req, res, (err) => {
    if (err) {
      console.error('Google auth error:', err.message);
      return res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
    }
  });
});

router.get('/google/callback',
  (req, res, next) => {
    if (!isGoogleConfigured()) {
      return res.redirect(`${FRONTEND_URL}/login?error=google_not_configured`);
    }
    passport.authenticate('google', {
      failureRedirect: `${FRONTEND_URL}/login?error=auth_failed`,
      failureMessage: true,
    })(req, res, next);
  },
  (req, res) => {
    const user = req.user;

    if (!user) {
      return res.redirect(`${FRONTEND_URL}/login?error=not_registered`);
    }

    if (!user.role) {
      return res.redirect(`${FRONTEND_URL}/login?error=not_registered`);
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organization_id,
        restaurantId: user.restaurant_id,
        avatar: user.avatar,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    const redirectPath = getRedirectPath(user.role);
    res.redirect(`${FRONTEND_URL}${redirectPath}?token=${token}`);
  }
);

// Current session profile. Accepts a Keycloak SSO token or a legacy/demo token
// (via the shared `authenticate` middleware), then returns the full Lunchify
// user record — role, organization, restaurant, department.
router.get('/me', authenticate, (req, res) => {
  const user =
    db.find('users', (u) => u.id === req.user.id) ||
    db.find('users', (u) => u.email?.toLowerCase() === req.user.email?.toLowerCase());

  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  return res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organization_id,
    restaurantId: user.restaurant_id,
    avatar: user.avatar || null,
    employee_number: user.employee_number || null,
    department: user.department || null,
  });
});

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) console.error('Logout error:', err);
    res.redirect(`${FRONTEND_URL}/login`);
  });
});

router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/demo-token', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const user = db.find('users', u => u.email === email);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organization_id,
      restaurantId: user.restaurant_id,
      avatar: user.avatar,
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  db.auditLog(user.id, 'login', 'user', user.id, { method: 'demo' });

  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

function getRedirectPath(role) {
  switch (role) {
    case 'SUPER_ADMIN': return '/admin';
    case 'RESTAURANT_MANAGER': return '/restaurant';
    case 'EMPLOYEE':
    default: return '/employee';
  }
}

export default router;
