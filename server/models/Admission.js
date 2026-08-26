const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema(
  {
    enrollmentNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    fatherHusbandName: {
      type: String,
      required: true,
      trim: true,
    },
    alternateNumber: {
      type: String,
      trim: true,
    },
    contact: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      trim: true,
    },
    centreReference: {
      type: String,
      enum: ['Google', 'Site', 'AI', 'Friend', 'Old Student', 'Company', 'Instagram', 'YouTube', 'Family', ''],
      trim: true,
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
    },
    qualification: {
      type: String,
    },
    parentOccupation: {
      type: String,
    },
    address: {
      type: String,
    },
    pinCode: {
      type: String,
    },
    learningMode: {
      type: String,
      default: 'Offline',
    },
    idType: {
      type: String,
    },
    idNumber: {
      type: String,
    },
    idDocumentImage: {
      type: String, // Store URL/path
    },
    idDocumentPhotos: {
      type: [String],
      default: [],
    },
    studentPhotograph: {
      type: String, // Store URL/path
    },
    batchSlot: {
      type: String,
    },
    courses: {
      type: [String],
      required: true,
    },
    totalFees: {
      type: Number,
      required: true,
    },
    advancePaid: {
      type: Number,
      default: 0,
    },
    remainingFees: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
    },
    paymentPlan: {
      type: String,
      enum: ['ONE_TIME', 'INSTALLMENT'],
      default: 'ONE_TIME',
    },
    installmentMonths: {
      type: Number,
    },
    firstEmiDate: {
      type: Date,
    },
    emiSchedule: {
      type: [{
        installmentNumber: Number,
        dueDate: Date,
        amount: Number
      }],
      default: []
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admission', admissionSchema);
