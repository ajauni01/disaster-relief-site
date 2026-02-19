const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { listUpdates } = require('../controllers/updateController');

const router = express.Router();

router.get('/', asyncHandler(listUpdates));

module.exports = router;
