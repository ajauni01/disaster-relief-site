const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    timestampLabel: { type: String, required: true, trim: true },
    snippet: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Update', updateSchema);
