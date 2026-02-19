const Alert = require('../models/Alert');
const StatusTile = require('../models/StatusTile');
const Update = require('../models/Update');
const Shelter = require('../models/Shelter');
const Resource = require('../models/Resource');

async function getDashboard(req, res) {
  const [activeAlert, statusTiles, updates, shelters, resources] = await Promise.all([
    Alert.findOne({ status: 'active' }).sort({ updatedAt: -1 }).lean(),
    StatusTile.find().sort({ displayOrder: 1, createdAt: 1 }).lean(),
    Update.find().sort({ createdAt: -1 }).limit(8).lean(),
    Shelter.find({ isOpen: true }).sort({ createdAt: -1 }).lean(),
    Resource.find().sort({ createdAt: -1 }).limit(8).lean()
  ]);

  res.json({
    success: true,
    data: {
      activeAlert,
      statusTiles,
      updates,
      shelters,
      resources
    }
  });
}

module.exports = { getDashboard };
