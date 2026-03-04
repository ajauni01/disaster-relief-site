const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { requireRole } = require('../../middleware/auth');
const {
  listAdminUsers,
  createAdminUser,
  updateAdminRole,
  removeAdminUser,
  listActivityLogs
} = require('../../controllers/admin/userController');

const router = express.Router();

router.get('/users', requireRole('super-admin'), asyncHandler(listAdminUsers));
router.post('/users', requireRole('super-admin'), asyncHandler(createAdminUser));
router.patch('/users/:id/role', requireRole('super-admin'), asyncHandler(updateAdminRole));
router.delete('/users/:id', requireRole('super-admin'), asyncHandler(removeAdminUser));
router.get('/activity-logs', requireRole('super-admin'), asyncHandler(listActivityLogs));

module.exports = router;
