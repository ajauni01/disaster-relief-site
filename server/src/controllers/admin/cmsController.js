const SiteContent = require('../../models/SiteContent');
const { logActivity } = require('../../utils/activityLogger');

async function ensureSiteContent() {
  let doc = await SiteContent.findOne({ singletonKey: 'site-content' });
  if (!doc) {
    doc = await SiteContent.create({ singletonKey: 'site-content' });
  }
  return doc;
}

function normalizeHotlines(rawHotlines) {
  if (!Array.isArray(rawHotlines)) {
    return [];
  }

  return rawHotlines
    .map((line) => String(line || '').trim())
    .filter(Boolean)
    .slice(0, 10);
}

async function getPublicSiteContent(req, res) {
  const doc = await ensureSiteContent();
  const publishedAnnouncements = doc.announcements
    .filter((announcement) => announcement.published)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  return res.json({
    success: true,
    data: {
      emergencyMessage: doc.emergencyMessage,
      hotlineNumbers: doc.hotlineNumbers,
      announcements: publishedAnnouncements
    }
  });
}

async function getAdminSiteContent(req, res) {
  const doc = await ensureSiteContent();
  return res.json({ success: true, data: doc });
}

async function updateEmergencyMessage(req, res) {
  const message = String(req.body.emergencyMessage || '').trim();
  if (!message) {
    return res.status(400).json({ success: false, message: 'Emergency message is required' });
  }

  const doc = await ensureSiteContent();
  doc.emergencyMessage = message;
  await doc.save();

  await logActivity({
    actor: req.user,
    action: 'cms.emergency.updated',
    details: 'Homepage emergency message updated'
  });

  return res.json({ success: true, data: doc });
}

async function updateHotlines(req, res) {
  const hotlines = normalizeHotlines(req.body.hotlineNumbers);
  if (!hotlines.length) {
    return res.status(400).json({ success: false, message: 'At least one hotline number is required' });
  }

  const doc = await ensureSiteContent();
  doc.hotlineNumbers = hotlines;
  await doc.save();

  await logActivity({
    actor: req.user,
    action: 'cms.hotlines.updated',
    details: `Hotline numbers updated (${hotlines.length} entries)`
  });

  return res.json({ success: true, data: doc });
}

async function createAnnouncement(req, res) {
  const title = String(req.body.title || '').trim();
  const body = String(req.body.body || '').trim();
  const published = req.body.published !== false;

  if (!title || !body) {
    return res.status(400).json({ success: false, message: 'Announcement title and body are required' });
  }

  const doc = await ensureSiteContent();
  doc.announcements.unshift({ title, body, published });
  await doc.save();

  await logActivity({
    actor: req.user,
    action: 'cms.announcement.created',
    details: `Announcement "${title}" created (${published ? 'published' : 'draft'})`
  });

  return res.status(201).json({ success: true, data: doc.announcements[0] });
}

async function toggleAnnouncementPublish(req, res) {
  const published = req.body.published === true;
  const doc = await ensureSiteContent();
  const announcement = doc.announcements.id(req.params.announcementId);

  if (!announcement) {
    return res.status(404).json({ success: false, message: 'Announcement not found' });
  }

  announcement.published = published;
  await doc.save();

  await logActivity({
    actor: req.user,
    action: 'cms.announcement.publish-toggled',
    details: `Announcement "${announcement.title}" set to ${published ? 'published' : 'unpublished'}`
  });

  return res.json({ success: true, data: announcement });
}

module.exports = {
  getPublicSiteContent,
  getAdminSiteContent,
  updateEmergencyMessage,
  updateHotlines,
  createAnnouncement,
  toggleAnnouncementPublish
};
