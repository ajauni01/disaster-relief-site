const HelpRequest = require('../models/HelpRequest');

function validateHelpRequest(body) {
  const required = ['name', 'location', 'contact', 'requestType', 'description'];
  for (const field of required) {
    if (!body[field] || typeof body[field] !== 'string' || body[field].trim().length === 0) {
      const error = new Error(`Invalid or missing field: ${field}`);
      error.statusCode = 400;
      throw error;
    }
  }

  if (body.urgency !== undefined) {
    const urgency = String(body.urgency).trim().toLowerCase();
    const allowedUrgency = ['high', 'medium', 'low'];
    if (!allowedUrgency.includes(urgency)) {
      const error = new Error('Invalid urgency value');
      error.statusCode = 400;
      throw error;
    }
  }
}

async function createHelpRequest(req, res) {
  validateHelpRequest(req.body);
  const payload = {
    name: req.body.name.trim(),
    location: req.body.location.trim(),
    contact: req.body.contact.trim(),
    requestType: req.body.requestType.trim(),
    urgency: req.body.urgency ? req.body.urgency.trim().toLowerCase() : 'medium',
    description: req.body.description.trim()
  };

  const helpRequest = await HelpRequest.create(payload);
  res.status(201).json({ success: true, data: helpRequest });
}

async function listHelpRequests(req, res) {
  const requests = await HelpRequest.find()
    .populate('assignedVolunteer', 'name email phone')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: requests });
}

module.exports = { createHelpRequest, listHelpRequests };
