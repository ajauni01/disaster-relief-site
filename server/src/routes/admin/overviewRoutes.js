const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { getOverview } = require('../../controllers/admin/overviewController');

const router = express.Router();

router.get('/', asyncHandler(getOverview));

module.exports = router;
