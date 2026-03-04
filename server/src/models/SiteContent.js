const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    body: { type: String, required: true, trim: true, maxlength: 1200 },
    published: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const siteContentSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      unique: true,
      default: 'site-content'
    },
    emergencyMessage: {
      type: String,
      trim: true,
      default: 'Emergency? Call 911',
      maxlength: 180
    },
    hotlineNumbers: {
      type: [String],
      default: ['911', '(402) 375-2660']
    },
    announcements: {
      type: [announcementSchema],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteContent', siteContentSchema);
