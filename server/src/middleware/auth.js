const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-flight-booking-key-change-in-production';

// Verify token middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: true, message: 'Authentication token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: true, message: 'Invalid or expired authentication token' });
    }
    req.user = user;
    next();
  });
};

// Check admin role middleware
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: true, message: 'User context not found' });
  }
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: true, message: 'Access denied: Administrator permissions required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  isAdmin,
};
