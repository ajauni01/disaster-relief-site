const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { listResources } = require('../controllers/resourceController');

const router = express.Router();

router.get('/', asyncHandler(listResources));

module.exports = router;
