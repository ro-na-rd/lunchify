const rateLimitStore = new Map();

export function rateLimit({ windowMs = 60000, max = 100 } = {}) {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, []);
    }

    const timestamps = rateLimitStore.get(key).filter(t => t > windowStart);
    rateLimitStore.set(key, timestamps);

    if (timestamps.length >= max) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    timestamps.push(now);
    next();
  };
}
