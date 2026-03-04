const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const {
  listVolunteers,
  createVolunteer,
  updateVolunteerApproval,
  updateVolunteerAvailability,
  removeVolunteer
} = require('../../controllers/admin/volunteerController');

const router = express.Router();

router.get('/', asyncHandler(listVolunteers));
router.post('/', asyncHandler(createVolunteer));
router.patch('/:id/approval', asyncHandler(updateVolunteerApproval));
router.patch('/:id/availability', asyncHandler(updateVolunteerAvailability));
router.delete('/:id', asyncHandler(removeVolunteer));

module.exports = router;
