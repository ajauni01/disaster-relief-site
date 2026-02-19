const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    amount: { type: Number, required: true, min: 1 },
    message: { type: String, trim: true, maxlength: 500 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Donation', donationSchema);
