import { createRemoteJWKSet, jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';

/*
 * Keycloak (Azul Tech SSO) token verification.
 *
 * Keycloak is the identity provider: users are local to Keycloak, provisioned
 * by an admin (see keycloak/scripts/provision-users.sh). The SPA sends a
 * Keycloak-issued access token (RS256); we verify it against Keycloak's
 * published JWKS, then map the identity onto a Lunchify user record.
 *
 * ROLE is authoritative from the token's client-role claim
 * (`resource_access.lunchify.roles` — assigned in Keycloak, see
 * docs/PHASE-1-REALM.md for the claim contract) and re-synced on every
 * login, so a role change in Keycloak takes effect immediately. The
 * BOOTSTRAP_ADMIN_EMAILS / Lunchify-DB role is only a fallback for a token
 * that carries no lunchify client role at all.
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

// Keycloak client role (assigned in the "lunchify" client, see
// configure-realm.sh) -> Lunchify's internal role name.
const CLIENT_ROLE_TO_LUNCHIFY_ROLE = {
  'super-admin': 'SUPER_ADMIN',
  'restaurant-manager': 'RESTAURANT_MANAGER',
  employee: 'EMPLOYEE',
};
const ROLE_PRIORITY = ['SUPER_ADMIN', 'RESTAURANT_MANAGER', 'EMPLOYEE'];

/** Read the Lunchify role from the token's client-role claim, if present. */
function roleFromClaims(claims) {
  const clientRoles = claims.resource_access?.lunchify?.roles || [];
  const mapped = clientRoles.map((r) => CLIENT_ROLE_TO_LUNCHIFY_ROLE[r]).filter(Boolean);
  if (!mapped.length) return null;
  return ROLE_PRIORITY.find((r) => mapped.includes(r)) || mapped[0];
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
  const claimRole = roleFromClaims(claims);

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
      role: claimRole || (BOOTSTRAP_ADMINS.includes(email) ? 'SUPER_ADMIN' : 'EMPLOYEE'),
      organization_id: org.id,
      restaurant_id: null,
      employee_number: null,
      department: null,
      keycloak_sub: claims.sub,
      created_at: new Date().toISOString(),
    };
    db.insert('users', user);
    db.auditLog(user.id, 'user_created_via_sso', 'user', user.id, {
      email, provider: 'keycloak', role: user.role, source: claimRole ? 'client_role_claim' : 'bootstrap',
    });
  } else {
    const patch = {};
    if (claims.sub && user.keycloak_sub !== claims.sub) patch.keycloak_sub = claims.sub;
    if (claimRole && user.role !== claimRole) {
      // Keycloak's lunchify client role is authoritative when present — a role
      // change there (Admin panel -> Users -> Role Mapping) takes effect on
      // the person's next login, no Lunchify-side action needed.
      patch.role = claimRole;
    } else if (!claimRole && BOOTSTRAP_ADMINS.includes(email) && user.role === 'EMPLOYEE') {
      // Fallback only: a bootstrap admin whose token carries no client role yet.
      patch.role = 'SUPER_ADMIN';
    }
    if (Object.keys(patch).length) {
      db.update('users', (u) => u.id === user.id, patch);
      if (patch.role) db.auditLog(user.id, 'role_synced_from_keycloak', 'user', user.id, { role: patch.role });
    }
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
