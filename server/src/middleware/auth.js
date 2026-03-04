const jwt = require('jsonwebtoken');
const config = require('../config/env');
const AdminUser = require('../models/AdminUser');

function extractToken(req) {
  const authorization = req.headers.authorization || '';
  if (authorization.startsWith('Bearer ')) {
    return authorization.slice(7).trim();
  }
  return '';
}

async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const adminUser = await AdminUser.findById(decoded.sub).lean();

    if (!adminUser || !adminUser.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid authentication session' });
    }

    req.user = {
      _id: adminUser._id,
      email: adminUser.email,
      role: adminUser.role
    };

    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

function requireRole(roles) {
  const allow = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!allow.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
