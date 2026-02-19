const HelpRequest = require('../../models/HelpRequest');
const Volunteer = require('../../models/Volunteer');

async function getAnalytics(req, res) {
  const [
    totalSignups,
    totalHelpRequests,
    byUrgency,
    byResolution,
    helpTypeSummary
  ] = await Promise.all([
    Volunteer.countDocuments({ isActive: true }),
    HelpRequest.countDocuments(),
    HelpRequest.aggregate([
      { $group: { _id: '$urgency', count: { $sum: 1 } } }
    ]),
    HelpRequest.aggregate([
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$status', 'resolved'] }, 'resolved', 'unresolved']
          },
          count: { $sum: 1 }
        }
      }
    ]),
    HelpRequest.aggregate([
      { $group: { _id: '$requestType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ])
  ]);

  const normalizeObject = (pairs, defaults) => {
    const result = { ...defaults };
    pairs.forEach((entry) => {
      if (entry && entry._id) {
        result[entry._id] = entry.count;
      }
    });
    return result;
  };

  const requestsByUrgency = normalizeObject(byUrgency, { high: 0, medium: 0, low: 0 });
  const resolvedVsUnresolved = normalizeObject(byResolution, { resolved: 0, unresolved: 0 });
  const mostRequestedHelpType = helpTypeSummary[0]
    ? { type: helpTypeSummary[0]._id, count: helpTypeSummary[0].count }
    : { type: 'none', count: 0 };

  return res.json({
    success: true,
    data: {
      totalSignups,
      totalHelpRequests,
      requestsByUrgency,
      resolvedVsUnresolved,
      mostRequestedHelpType
    }
  });
}

module.exports = { getAnalytics };
