const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { listShelters } = require('../controllers/shelterController');

const router = express.Router();

router.get('/', asyncHandler(listShelters));

module.exports = router;
