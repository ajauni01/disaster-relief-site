const HelpRequest = require('../../models/HelpRequest');
const Volunteer = require('../../models/Volunteer');
const InventoryResource = require('../../models/InventoryResource');
const ActivityLog = require('../../models/ActivityLog');

async function getOverview(req, res) {
  const [
    totalHelpRequests,
    resolvedRequests,
    openRequests,
    totalVolunteers,
    availableVolunteers,
    inventorySummary,
    recentActivity
  ] = await Promise.all([
    HelpRequest.countDocuments(),
    HelpRequest.countDocuments({ status: 'resolved' }),
    HelpRequest.countDocuments({ status: { $in: ['new', 'in-progress'] } }),
    Volunteer.countDocuments({ isActive: true }),
    Volunteer.countDocuments({ isActive: true, approvalStatus: 'approved', availabilityStatus: 'available' }),
    InventoryResource.aggregate([
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
          itemCount: { $sum: 1 }
        }
      }
    ]),
    ActivityLog.find().sort({ createdAt: -1 }).limit(5).lean()
  ]);

  const inventory = inventorySummary[0] || { totalQuantity: 0, itemCount: 0 };

  return res.json({
    success: true,
    data: {
      totalHelpRequests,
      openRequests,
      resolvedRequests,
      totalVolunteers,
      availableVolunteers,
      totalResourcesAvailable: inventory.totalQuantity,
      totalResourceItems: inventory.itemCount,
      recentActivity
    }
  });
}

module.exports = { getOverview };
