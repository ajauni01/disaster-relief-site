const mongoose = require('mongoose');

const helpRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    contact: { type: String, required: true, trim: true, maxlength: 80 },
    requestType: {
      type: String,
      enum: ['food', 'transportation', 'medical', 'shelter', 'other'],
      required: true
    },
    urgency: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ['new', 'in-progress', 'resolved'],
      default: 'new'
    },
    assignedVolunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Volunteer',
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('HelpRequest', helpRequestSchema);
