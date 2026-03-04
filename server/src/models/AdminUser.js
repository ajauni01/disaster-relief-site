const mongoose = require('mongoose');

const adminUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 160
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['super-admin', 'admin'],
      default: 'admin'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminUser', adminUserSchema);
