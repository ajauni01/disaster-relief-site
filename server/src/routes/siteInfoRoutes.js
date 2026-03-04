const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { getPublicSiteContent } = require('../controllers/admin/cmsController');

const router = express.Router();

router.get('/', asyncHandler(getPublicSiteContent));

module.exports = router;
