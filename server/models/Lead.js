const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    alternatePhone: {
      type: String,
    },
    email: {
      type: String,
    },       
    message: {
      type: String,
    },
    course: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      default: "popup",
    },
    status: {
      type: String,
      default: "New",
    },
    counsellor: {
      type: String,
      default: "Unassigned",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    leadType: {
      type: String,
      default: "Cold", // Cold, Warm, Hot, Sale
    },
  },
  { timestamps: true }
);

// Indexes for fast querying, filtering, and sorting
leadSchema.index({ createdAt: -1 });
leadSchema.index({ status: 1 });
leadSchema.index({ phone: 1 });

module.exports = mongoose.model('Lead', leadSchema);
