const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    skills: { type: [String], default: [] },
    availability: { type: String, required: true, trim: true, maxlength: 100 },
    availabilityStatus: {
      type: String,
      enum: ['available', 'busy'],
      default: 'available'
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    assignedTask: { type: String, trim: true, maxlength: 140, default: '' },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Volunteer', volunteerSchema);
