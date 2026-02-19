const InventoryResource = require('../../models/InventoryResource');
const { logActivity } = require('../../utils/activityLogger');

async function listInventory(req, res) {
  const records = await InventoryResource.find().sort({ updatedAt: -1 }).lean();

  const data = records.map((item) => ({
    ...item,
    isLowStock: item.quantity <= item.lowStockThreshold
  }));

  return res.json({ success: true, data });
}

async function createInventoryItem(req, res) {
  const name = String(req.body.name || '').trim();
  const category = String(req.body.category || '').trim();
  const quantity = Number(req.body.quantity);
  const location = String(req.body.location || '').trim();
  const lowStockThreshold = Number(req.body.lowStockThreshold || 10);

  if (!name || !category || !Number.isFinite(quantity) || quantity < 0) {
    return res.status(400).json({ success: false, message: 'Invalid inventory payload' });
  }

  const item = await InventoryResource.create({
    name,
    category,
    quantity,
    location,
    lowStockThreshold: Number.isFinite(lowStockThreshold) && lowStockThreshold >= 0 ? lowStockThreshold : 10
  });

  await logActivity({
    actor: req.user,
    action: 'inventory.created',
    details: `Inventory item ${item.name} created with qty ${item.quantity}`
  });

  return res.status(201).json({ success: true, data: item });
}

async function updateInventoryItem(req, res) {
  const item = await InventoryResource.findById(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Inventory item not found' });
  }

  if (req.body.name !== undefined) item.name = String(req.body.name || '').trim();
  if (req.body.category !== undefined) item.category = String(req.body.category || '').trim();
  if (req.body.location !== undefined) item.location = String(req.body.location || '').trim();

  if (req.body.quantity !== undefined) {
    const quantity = Number(req.body.quantity);
    if (!Number.isFinite(quantity) || quantity < 0) {
      return res.status(400).json({ success: false, message: 'Invalid quantity' });
    }
    item.quantity = quantity;
  }

  if (req.body.lowStockThreshold !== undefined) {
    const threshold = Number(req.body.lowStockThreshold);
    if (!Number.isFinite(threshold) || threshold < 0) {
      return res.status(400).json({ success: false, message: 'Invalid low stock threshold' });
    }
    item.lowStockThreshold = threshold;
  }

  await item.save();

  await logActivity({
    actor: req.user,
    action: 'inventory.updated',
    details: `Inventory item ${item.name} updated`
  });

  return res.json({
    success: true,
    data: {
      ...item.toObject(),
      isLowStock: item.quantity <= item.lowStockThreshold
    }
  });
}

async function deleteInventoryItem(req, res) {
  const item = await InventoryResource.findById(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Inventory item not found' });
  }

  await item.deleteOne();

  await logActivity({
    actor: req.user,
    action: 'inventory.deleted',
    details: `Inventory item ${item.name} removed`
  });

  return res.json({ success: true, data: { id: item._id } });
}

module.exports = {
  listInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
};
