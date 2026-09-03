import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import './db.js';
import './seed.js';
import { configurePassport } from './passport.js';
import { rateLimit } from './middleware/rateLimit.js';

import ssoRoutes from './routes/sso.js';
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employee.js';
import adminRoutes from './routes/admin.js';
import restaurantRoutes from './routes/restaurant.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

configurePassport();

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'lunchify-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 200 }));

app.use('/auth', ssoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/restaurant', restaurantRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    sso: 'keycloak',
    issuer: process.env.KEYCLOAK_ISSUER || 'http://localhost:8081/realms/azul-tech',
    domain: process.env.ALLOWED_EMAIL_DOMAIN || 'azultech.rw',
  });
});

app.use(express.static(join(__dirname, '..', '..', 'client', 'dist')));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/auth')) {
    res.sendFile(join(__dirname, '..', '..', 'client', 'dist', 'index.html'));
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n  Lunchify SSO Server`);
  console.log(`  ====================`);
  console.log(`  Server:    http://localhost:${PORT}`);
  console.log(`  Frontend:  ${FRONTEND_URL}`);
  console.log(`  SSO:       Keycloak — ${process.env.KEYCLOAK_ISSUER || 'http://localhost:8081/realms/azul-tech'}`);
  console.log(`  Domain:    @${process.env.ALLOWED_EMAIL_DOMAIN || 'azultech.rw'}`);
  console.log(`  Health:    http://localhost:${PORT}/api/health\n`);
});
