import { createRemoteJWKSet, jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';

/*
 * Keycloak (Azul Tech SSO) token verification.
 *
 * The SPA sends a Keycloak-issued access token (RS256). We verify it against
 * Keycloak's published JWKS, enforce the company email domain, then map the
 * identity onto a Lunchify user record (creating one on first login).
 *
 * Role / organization / restaurant assignment stays in the Lunchify database,
 * keyed by email — Keycloak only proves who the user is.
 */

const ISSUER = process.env.KEYCLOAK_ISSUER || 'http://localhost:8081/realms/azul-tech';
const JWKS_URI = process.env.KEYCLOAK_JWKS_URI || `${ISSUER}/protocol/openid-connect/certs`;
const ALLOWED_AZP = (process.env.KEYCLOAK_ALLOWED_AZP || 'lunchify')
  .split(',').map((s) => s.trim()).filter(Boolean);
const ALLOWED_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAIN || 'azultech.rw')
  .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

// Emails that are provisioned as SUPER_ADMIN on first login. Needed to bootstrap
// the very first admin (who then promotes others in the Employees screen).
const BOOTSTRAP_ADMINS = (process.env.BOOTSTRAP_ADMIN_EMAILS || '')
  .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

const jwks = createRemoteJWKSet(new URL(JWKS_URI));

export function isCompanyEmail(email) {
  if (!email) return false;
  const lower = email.toLowerCase();
  return ALLOWED_DOMAINS.some((d) => lower.endsWith(`@${d}`));
}

/** Verify a Keycloak access token. Returns the claim set, or throws. */
export async function verifyKeycloakToken(token) {
  const { payload } = await jwtVerify(token, jwks, { issuer: ISSUER });
  if (ALLOWED_AZP.length && payload.azp && !ALLOWED_AZP.includes(payload.azp)) {
    throw new Error(`Token not issued for an allowed client (azp=${payload.azp})`);
  }
  return payload;
}

/** Pick the organization a newly-provisioned SSO employee belongs to. */
function resolveDefaultOrganization() {
  const azul = db.find('organizations', (o) => /azul/i.test(o.name));
  if (azul) return azul;
  const any = db.find('organizations', () => true);
  if (any) return any;
  const org = {
    id: uuidv4(),
    name: 'Azul Tech',
    lunch_cutoff_hour: 10,
    lunch_cutoff_minute: 30,
    created_at: new Date().toISOString(),
  };
  db.insert('organizations', org);
  return org;
}

/**
 * Map verified Keycloak claims onto a Lunchify user.
 * Creates the user as EMPLOYEE on first login; never changes an existing role.
 */
export function resolveLunchifyUser(claims) {
  const email = (claims.email || '').toLowerCase();
  if (!isCompanyEmail(email)) {
    const err = new Error('Your account is not authorized for Lunchify.');
    err.status = 403;
    throw err;
  }

  let user = db.find('users', (u) => u.email?.toLowerCase() === email);

  if (!user) {
    const org = resolveDefaultOrganization();
    const name =
      claims.name ||
      [claims.given_name, claims.family_name].filter(Boolean).join(' ').trim() ||
      email.split('@')[0];

    user = {
      id: uuidv4(),
      email,
      name,
      role: BOOTSTRAP_ADMINS.includes(email) ? 'SUPER_ADMIN' : 'EMPLOYEE',
      organization_id: org.id,
      restaurant_id: null,
      employee_number: null,
      department: null,
      keycloak_sub: claims.sub,
      created_at: new Date().toISOString(),
    };
    db.insert('users', user);
    db.auditLog(user.id, 'user_created_via_sso', 'user', user.id, { email, provider: 'keycloak', role: user.role });
  } else {
    const patch = {};
    if (claims.sub && user.keycloak_sub !== claims.sub) patch.keycloak_sub = claims.sub;
    // Keep a configured bootstrap admin at SUPER_ADMIN even if it was created earlier as EMPLOYEE.
    if (BOOTSTRAP_ADMINS.includes(email) && user.role === 'EMPLOYEE') patch.role = 'SUPER_ADMIN';
    if (Object.keys(patch).length) db.update('users', (u) => u.id === user.id, patch);
  }

  // Record a login at most once per LOGIN_AUDIT_WINDOW (this runs on every API
  // request, so an unconditional audit row would spam the store).
  const LOGIN_AUDIT_WINDOW_MS = 30 * 60 * 1000;
  const last = user.last_login ? Date.parse(user.last_login) : 0;
  if (Date.now() - last > LOGIN_AUDIT_WINDOW_MS) {
    db.update('users', (u) => u.id === user.id, { last_login: new Date().toISOString() });
    db.auditLog(user.id, 'login', 'user', user.id, { method: 'keycloak_sso' });
  }

  return user;
}

/**
 * Express middleware: authenticate a request using a Keycloak access token.
 * On success, req.user is the Lunchify token payload shape used across routes.
 */
export async function authenticateKeycloak(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const claims = await verifyKeycloakToken(header.slice(7));
    const user = resolveLunchifyUser(claims);
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organization_id,
      restaurantId: user.restaurant_id,
    };
    req.keycloak = claims;
    next();
  } catch (err) {
    res.status(err.status || 401).json({ error: err.message || 'Invalid token' });
  }
}
