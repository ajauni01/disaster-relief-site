const bcrypt = require('bcryptjs');

const AdminUser = require('../../models/AdminUser');
const ActivityLog = require('../../models/ActivityLog');
const { logActivity } = require('../../utils/activityLogger');

async function listAdminUsers(req, res) {
  const users = await AdminUser.find({ isActive: true })
    .select('_id email role createdAt updatedAt')
    .sort({ createdAt: -1 })
    .lean();

  return res.json({ success: true, data: users });
}

async function createAdminUser(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const role = req.body.role === 'super-admin' ? 'super-admin' : 'admin';

  if (!email || !password || password.length < 8) {
    return res.status(400).json({ success: false, message: 'Valid email and password (min 8 chars) are required' });
  }

  const existing = await AdminUser.findOne({ email });
  if (existing && existing.isActive) {
    return res.status(409).json({ success: false, message: 'Admin user already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  let user;
  if (existing && !existing.isActive) {
    existing.passwordHash = passwordHash;
    existing.role = role;
    existing.isActive = true;
    user = await existing.save();
  } else {
    user = await AdminUser.create({ email, passwordHash, role });
  }

  await logActivity({
    actor: req.user,
    action: 'admin-user.created',
    details: `Admin user ${user.email} created as ${user.role}`
  });

  return res.status(201).json({
    success: true,
    data: {
      id: user._id,
      email: user.email,
      role: user.role
    }
  });
}

async function updateAdminRole(req, res) {
  const role = req.body.role === 'super-admin' ? 'super-admin' : req.body.role === 'admin' ? 'admin' : '';
  if (!role) {
    return res.status(400).json({ success: false, message: 'Invalid role value' });
  }

  const user = await AdminUser.findOne({ _id: req.params.id, isActive: true });
  if (!user) {
    return res.status(404).json({ success: false, message: 'Admin user not found' });
  }

  if (user.role === 'super-admin' && role === 'admin') {
    const superAdminCount = await AdminUser.countDocuments({ role: 'super-admin', isActive: true });
    if (superAdminCount <= 1) {
      return res.status(400).json({ success: false, message: 'At least one super admin is required' });
    }
  }

  user.role = role;
  await user.save();

  await logActivity({
    actor: req.user,
    action: 'admin-user.role.updated',
    details: `Admin user ${user.email} role changed to ${role}`
  });

  return res.json({ success: true, data: { id: user._id, role: user.role } });
}

async function removeAdminUser(req, res) {
  const user = await AdminUser.findOne({ _id: req.params.id, isActive: true });
  if (!user) {
    return res.status(404).json({ success: false, message: 'Admin user not found' });
  }

  if (String(user._id) === String(req.user._id)) {
    return res.status(400).json({ success: false, message: 'You cannot remove your own account' });
  }

  if (user.role === 'super-admin') {
    const superAdminCount = await AdminUser.countDocuments({ role: 'super-admin', isActive: true });
    if (superAdminCount <= 1) {
      return res.status(400).json({ success: false, message: 'At least one super admin is required' });
    }
  }

  user.isActive = false;
  await user.save();

  await logActivity({
    actor: req.user,
    action: 'admin-user.removed',
    details: `Admin user ${user.email} removed`
  });

  return res.json({ success: true, data: { id: user._id } });
}

async function listActivityLogs(req, res) {
  const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
  const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(limit).lean();
  return res.json({ success: true, data: logs });
}

module.exports = {
  listAdminUsers,
  createAdminUser,
  updateAdminRole,
  removeAdminUser,
  listActivityLogs
};
