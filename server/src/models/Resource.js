const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resource', resourceSchema);
