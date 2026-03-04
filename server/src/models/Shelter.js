const mongoose = require('mongoose');

const shelterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 0 },
    occupancy: { type: Number, required: true, min: 0 },
    isOpen: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shelter', shelterSchema);
