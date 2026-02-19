const Volunteer = require('../models/Volunteer');

function validateVolunteer(body) {
  const required = ['name', 'email', 'phone', 'availability', 'location'];
  for (const field of required) {
    if (!body[field] || typeof body[field] !== 'string' || body[field].trim().length === 0) {
      const error = new Error(`Invalid or missing field: ${field}`);
      error.statusCode = 400;
      throw error;
    }
  }
}

async function createVolunteer(req, res) {
  validateVolunteer(req.body);

  const skills = Array.isArray(req.body.skills)
    ? req.body.skills.filter((skill) => typeof skill === 'string' && skill.trim().length > 0).map((skill) => skill.trim())
    : [];

  const volunteer = await Volunteer.create({
    name: req.body.name.trim(),
    email: req.body.email.trim(),
    phone: req.body.phone.trim(),
    availability: req.body.availability.trim(),
    location: req.body.location.trim(),
    skills,
    approvalStatus: 'pending',
    availabilityStatus: 'available'
  });

  res.status(201).json({ success: true, data: volunteer });
}

async function listVolunteers(req, res) {
  const volunteers = await Volunteer.find({ isActive: true, approvalStatus: 'approved' })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: volunteers });
}

module.exports = { createVolunteer, listVolunteers };
