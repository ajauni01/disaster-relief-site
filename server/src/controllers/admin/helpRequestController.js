const HelpRequest = require('../../models/HelpRequest');
const Volunteer = require('../../models/Volunteer');
const { logActivity } = require('../../utils/activityLogger');

async function listHelpRequests(req, res) {
  const query = {};

  if (req.query.status) {
    query.status = req.query.status;
  }
  if (req.query.urgency) {
    query.urgency = req.query.urgency;
  }

  const records = await HelpRequest.find(query)
    .populate('assignedVolunteer', 'name email phone availabilityStatus approvalStatus')
    .sort({ createdAt: -1 })
    .lean();

  return res.json({ success: true, data: records });
}

async function getHelpRequestDetails(req, res) {
  const record = await HelpRequest.findById(req.params.id)
    .populate('assignedVolunteer', 'name email phone availabilityStatus approvalStatus')
    .lean();

  if (!record) {
    return res.status(404).json({ success: false, message: 'Help request not found' });
  }

  return res.json({ success: true, data: record });
}

async function updateHelpRequestStatus(req, res) {
  const status = String(req.body.status || '').trim();
  const allow = ['new', 'in-progress', 'resolved'];

  if (!allow.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }

  const record = await HelpRequest.findById(req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, message: 'Help request not found' });
  }

  record.status = status;
  await record.save();

  if (status === 'resolved' && record.assignedVolunteer) {
    await Volunteer.findByIdAndUpdate(record.assignedVolunteer, {
      availabilityStatus: 'available',
      assignedTask: ''
    });
  }

  await logActivity({
    actor: req.user,
    action: 'help-request.status.updated',
    details: `Request ${record._id} status changed to ${status}`
  });

  return res.json({ success: true, data: record });
}

async function assignVolunteer(req, res) {
  const volunteerId = req.body.volunteerId === null ? null : String(req.body.volunteerId || '').trim();
  const record = await HelpRequest.findById(req.params.id);

  if (!record) {
    return res.status(404).json({ success: false, message: 'Help request not found' });
  }

  if (!volunteerId) {
    if (record.assignedVolunteer) {
      await Volunteer.findByIdAndUpdate(record.assignedVolunteer, {
        availabilityStatus: 'available',
        assignedTask: ''
      });
    }

    record.assignedVolunteer = null;
    await record.save();

    await logActivity({
      actor: req.user,
      action: 'help-request.volunteer.unassigned',
      details: `Volunteer unassigned from request ${record._id}`
    });

    return res.json({ success: true, data: record });
  }

  const volunteer = await Volunteer.findOne({
    _id: volunteerId,
    isActive: true,
    approvalStatus: 'approved'
  });

  if (!volunteer) {
    return res.status(404).json({ success: false, message: 'Approved volunteer not found' });
  }

  if (record.assignedVolunteer && String(record.assignedVolunteer) !== String(volunteer._id)) {
    await Volunteer.findByIdAndUpdate(record.assignedVolunteer, {
      availabilityStatus: 'available',
      assignedTask: ''
    });
  }

  volunteer.availabilityStatus = 'busy';
  volunteer.assignedTask = `${record.requestType} support - ${record.location}`;
  await volunteer.save();

  record.assignedVolunteer = volunteer._id;
  if (record.status === 'new') {
    record.status = 'in-progress';
  }
  await record.save();

  await logActivity({
    actor: req.user,
    action: 'help-request.volunteer.assigned',
    details: `Volunteer ${volunteer.email} assigned to request ${record._id}`
  });

  return res.json({ success: true, data: record });
}

module.exports = {
  listHelpRequests,
  getHelpRequestDetails,
  updateHelpRequestStatus,
  assignVolunteer
};
