const ActivityLog = require('../models/ActivityLog');

async function logActivity({ actor, action, details }) {
  const actorEmail = actor && actor.email ? actor.email : 'system';
  const actorId = actor && actor._id ? actor._id : null;

  await ActivityLog.create({
    actorId,
    actorEmail,
    action,
    details
  });
}

module.exports = { logActivity };
