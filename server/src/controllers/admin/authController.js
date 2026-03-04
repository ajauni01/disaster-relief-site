const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const config = require('../../config/env');
const AdminUser = require('../../models/AdminUser');
const { logActivity } = require('../../utils/activityLogger');

function signToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
      email: user.email
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiry }
  );
}

async function login(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const adminUser = await AdminUser.findOne({ email, isActive: true });
  if (!adminUser) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, adminUser.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = signToken(adminUser);

  await logActivity({
    actor: adminUser,
    action: 'admin.login',
    details: `User ${adminUser.email} signed in`
  });

  return res.json({
    success: true,
    data: {
      token,
      user: {
        id: adminUser._id,
        email: adminUser.email,
        role: adminUser.role
      }
    }
  });
}

async function me(req, res) {
  return res.json({
    success: true,
    data: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    }
  });
}

async function logout(req, res) {
  await logActivity({
    actor: req.user,
    action: 'admin.logout',
    details: `User ${req.user.email} signed out`
  });

  return res.json({ success: true, data: { message: 'Logged out' } });
}

module.exports = {
  login,
  me,
  logout
};
