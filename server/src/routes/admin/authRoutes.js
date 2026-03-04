const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { requireAuth } = require('../../middleware/auth');
const { login, me, logout } = require('../../controllers/admin/authController');

const router = express.Router();

router.post('/login', asyncHandler(login));
router.get('/me', requireAuth, asyncHandler(me));
router.post('/logout', requireAuth, asyncHandler(logout));

module.exports = router;
