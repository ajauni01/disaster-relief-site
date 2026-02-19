const Alert = require('../models/Alert');

async function listAlerts(req, res) {
  const alerts = await Alert.find().sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: alerts });
}

module.exports = { listAlerts };
