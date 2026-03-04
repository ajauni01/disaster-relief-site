const mongoose = require('mongoose');

const inventoryResourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    location: {
      type: String,
      trim: true,
      maxlength: 120,
      default: ''
    },
    lowStockThreshold: {
      type: Number,
      min: 0,
      default: 10
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('InventoryResource', inventoryResourceSchema);
