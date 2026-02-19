const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { createVolunteer, listVolunteers } = require('../controllers/volunteerController');

const router = express.Router();

router.get('/', asyncHandler(listVolunteers));
router.post('/', asyncHandler(createVolunteer));

module.exports = router;
