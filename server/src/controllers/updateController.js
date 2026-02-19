const Update = require('../models/Update');

async function listUpdates(req, res) {
  const updates = await Update.find().sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: updates });
}

module.exports = { listUpdates };
