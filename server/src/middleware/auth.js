import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'lunch-app-secret-key-change-in-production';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
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

  if (req.user.role === 'admin') {
    if (req.params.organizationId && req.params.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Access denied to this organization' });
    }
    req.targetOrganizationId = req.user.organizationId;
  } else if (req.user.role === 'employee') {
    req.targetOrganizationId = req.user.organizationId;
  }

  next();
}

export function verifyRestaurantAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role === 'restaurant_owner') {
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
