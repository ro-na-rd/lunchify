import jwt from 'jsonwebtoken';
import db from '../db.js';
import { verifyKeycloakToken, resolveLunchifyUser } from './keycloakAuth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'lunch-app-secret-key-change-in-production';

function decodeJwtHeader(token) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString('utf8'));
  } catch {
    return {};
  }
}

/**
 * Accepts either:
 *   - a Keycloak (Azul Tech SSO) access token, RS256, verified against JWKS, or
 *   - a legacy/demo Lunchify token, HS256, signed with JWT_SECRET.
 */
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.slice(7);

  if (decodeJwtHeader(token).alg?.startsWith('RS')) {
    try {
      const claims = await verifyKeycloakToken(token);
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
      return next();
    } catch (err) {
      return res.status(err.status || 401).json({ error: err.message || 'Invalid or expired token' });
    }
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export function verifyOrganizationAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const hasOrg = (orgId) => orgId && db.find('organizations', o => o.id === orgId);

  if (req.user.role === 'SUPER_ADMIN') {
    if (req.user.organizationId && hasOrg(req.user.organizationId)) {
      req.targetOrganizationId = req.user.organizationId;
    } else {
      const fallback = db.find('organizations', () => true);
      if (fallback) req.targetOrganizationId = fallback.id;
      else return res.status(500).json({ error: 'No organizations configured' });
    }
  } else if (req.user.role === 'EMPLOYEE') {
    req.targetOrganizationId = req.user.organizationId;
  } else if (req.user.role === 'RESTAURANT_MANAGER') {
    req.targetOrganizationId = req.user.organizationId;
  }

  next();
}

export function verifyRestaurantAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role === 'RESTAURANT_MANAGER') {
    if (req.params.restaurantId && req.params.restaurantId !== req.user.restaurantId) {
      return res.status(403).json({ error: 'Access denied to this restaurant' });
    }
    req.targetRestaurantId = req.user.restaurantId;
  }

  next();
}

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organization_id,
      restaurantId: user.restaurant_id,
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}
