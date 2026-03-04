const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const {
  getAdminSiteContent,
  updateEmergencyMessage,
  updateHotlines,
  createAnnouncement,
  toggleAnnouncementPublish
} = require('../../controllers/admin/cmsController');

const router = express.Router();

router.get('/', asyncHandler(getAdminSiteContent));
router.put('/emergency-message', asyncHandler(updateEmergencyMessage));
router.put('/hotlines', asyncHandler(updateHotlines));
router.post('/announcements', asyncHandler(createAnnouncement));
router.patch('/announcements/:announcementId/publish', asyncHandler(toggleAnnouncementPublish));

module.exports = router;
