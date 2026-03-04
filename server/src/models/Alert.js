const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: String,
      enum: ['extreme', 'high', 'moderate', 'info'],
      required: true
    },
    issuedTime: {
      type: String,
      required: true
    },
    validUntil: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'resolved'],
      default: 'active'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);
