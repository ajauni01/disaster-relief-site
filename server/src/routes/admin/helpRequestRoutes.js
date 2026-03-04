const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const {
  listHelpRequests,
  getHelpRequestDetails,
  updateHelpRequestStatus,
  assignVolunteer
} = require('../../controllers/admin/helpRequestController');

const router = express.Router();

router.get('/', asyncHandler(listHelpRequests));
router.get('/:id', asyncHandler(getHelpRequestDetails));
router.patch('/:id/status', asyncHandler(updateHelpRequestStatus));
router.patch('/:id/assign-volunteer', asyncHandler(assignVolunteer));

module.exports = router;
