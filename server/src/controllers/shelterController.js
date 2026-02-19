const Shelter = require('../models/Shelter');

async function listShelters(req, res) {
  const openOnly = req.query.openOnly === 'true';
  const query = openOnly ? { isOpen: true } : {};
  const shelters = await Shelter.find(query).sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: shelters });
}

module.exports = { listShelters };
