const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const {
  listInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
} = require('../../controllers/admin/inventoryController');

const router = express.Router();

router.get('/', asyncHandler(listInventory));
router.post('/', asyncHandler(createInventoryItem));
router.patch('/:id', asyncHandler(updateInventoryItem));
router.delete('/:id', asyncHandler(deleteInventoryItem));

module.exports = router;
