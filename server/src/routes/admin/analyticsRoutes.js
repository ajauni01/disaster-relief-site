const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { getAnalytics } = require('../../controllers/admin/analyticsController');

const router = express.Router();

router.get('/', asyncHandler(getAnalytics));

module.exports = router;
