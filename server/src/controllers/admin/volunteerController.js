const Volunteer = require('../../models/Volunteer');
const HelpRequest = require('../../models/HelpRequest');
const { logActivity } = require('../../utils/activityLogger');

function normalizeSkills(skills) {
  if (!Array.isArray(skills)) {
    return [];
  }
  return skills
    .map((skill) => String(skill || '').trim())
    .filter(Boolean);
}

async function listVolunteers(req, res) {
  const query = { isActive: true };

  if (req.query.approvalStatus) {
    query.approvalStatus = req.query.approvalStatus;
  }

  if (req.query.availabilityStatus) {
    query.availabilityStatus = req.query.availabilityStatus;
  }

  const records = await Volunteer.find(query).sort({ createdAt: -1 }).lean();
  return res.json({ success: true, data: records });
}

async function createVolunteer(req, res) {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const phone = String(req.body.phone || '').trim();
  const availability = String(req.body.availability || '').trim();
  const location = String(req.body.location || '').trim();

  if (!name || !email || !phone || !availability || !location) {
    return res.status(400).json({ success: false, message: 'Missing required volunteer fields' });
  }

  const volunteer = await Volunteer.create({
    name,
    email,
    phone,
    skills: normalizeSkills(req.body.skills),
    availability,
    location,
    availabilityStatus: req.body.availabilityStatus === 'busy' ? 'busy' : 'available',
    approvalStatus: req.body.approvalStatus === 'rejected' ? 'rejected' : req.body.approvalStatus === 'pending' ? 'pending' : 'approved'
  });

  await logActivity({
    actor: req.user,
    action: 'volunteer.created',
    details: `Volunteer ${volunteer.email} created by admin`
  });

  return res.status(201).json({ success: true, data: volunteer });
}

async function updateVolunteerApproval(req, res) {
  const approvalStatus = String(req.body.approvalStatus || '').trim();
  const allow = ['pending', 'approved', 'rejected'];

  if (!allow.includes(approvalStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid approval status' });
  }

  const volunteer = await Volunteer.findOne({ _id: req.params.id, isActive: true });
  if (!volunteer) {
    return res.status(404).json({ success: false, message: 'Volunteer not found' });
  }

  volunteer.approvalStatus = approvalStatus;
  if (approvalStatus !== 'approved') {
    volunteer.availabilityStatus = 'available';
    volunteer.assignedTask = '';
  }

  await volunteer.save();

  await logActivity({
    actor: req.user,
    action: 'volunteer.approval.updated',
    details: `Volunteer ${volunteer.email} approval set to ${approvalStatus}`
  });

  return res.json({ success: true, data: volunteer });
}

async function updateVolunteerAvailability(req, res) {
  const availabilityStatus = String(req.body.availabilityStatus || '').trim();
  const assignedTask = String(req.body.assignedTask || '').trim();
  const allow = ['available', 'busy'];

  if (!allow.includes(availabilityStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid availability status' });
  }

  const volunteer = await Volunteer.findOne({ _id: req.params.id, isActive: true });
  if (!volunteer) {
    return res.status(404).json({ success: false, message: 'Volunteer not found' });
  }

  volunteer.availabilityStatus = availabilityStatus;
  volunteer.assignedTask = availabilityStatus === 'busy' ? assignedTask : '';
  await volunteer.save();

  await logActivity({
    actor: req.user,
    action: 'volunteer.availability.updated',
    details: `Volunteer ${volunteer.email} availability set to ${availabilityStatus}`
  });

  return res.json({ success: true, data: volunteer });
}

async function removeVolunteer(req, res) {
  const volunteer = await Volunteer.findOne({ _id: req.params.id, isActive: true });
  if (!volunteer) {
    return res.status(404).json({ success: false, message: 'Volunteer not found' });
  }

  await HelpRequest.updateMany(
    { assignedVolunteer: volunteer._id, status: { $in: ['new', 'in-progress'] } },
    { $set: { assignedVolunteer: null, status: 'new' } }
  );

  volunteer.isActive = false;
  volunteer.availabilityStatus = 'available';
  volunteer.assignedTask = '';
  await volunteer.save();

  await logActivity({
    actor: req.user,
    action: 'volunteer.removed',
    details: `Volunteer ${volunteer.email} removed by admin`
  });

  return res.json({ success: true, data: { id: volunteer._id } });
}

module.exports = {
  listVolunteers,
  createVolunteer,
  updateVolunteerApproval,
  updateVolunteerAvailability,
  removeVolunteer
};
