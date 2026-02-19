const Resource = require('../models/Resource');

async function listResources(req, res) {
  const resources = await Resource.find().sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: resources });
}

module.exports = { listResources };
