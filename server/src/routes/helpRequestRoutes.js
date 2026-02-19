const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { createHelpRequest, listHelpRequests } = require('../controllers/helpRequestController');

const router = express.Router();

router.get('/', asyncHandler(listHelpRequests));
router.post('/', asyncHandler(createHelpRequest));

module.exports = router;
