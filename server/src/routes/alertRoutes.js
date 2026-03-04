const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { listAlerts } = require('../controllers/alertController');

const router = express.Router();

router.get('/', asyncHandler(listAlerts));

module.exports = router;
