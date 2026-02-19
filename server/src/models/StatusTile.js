const mongoose = require('mongoose');

const statusTileSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['good', 'warning', 'critical', 'info'],
      default: 'info'
    },
    icon: { type: String, required: true, trim: true },
    displayOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('StatusTile', statusTileSchema);
