const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: [true, 'Please specify student name']
    },
    enrollmentNumber: {
      type: String,
      required: [true, 'Please specify enrollment number'],
      unique: true
    },
    course: {
      type: String,
      required: [true, 'Please specify course name']
    },
    courseIssueDate: {
      type: String,
      required: [true, 'Please specify course issue date']
    },
    duration: {
      type: String,
      required: [true, 'Please specify course duration']
    },
    internship: {
      type: String,
      enum: ['Yes', 'No'],
      required: [true, 'Please specify internship status']
    },
    internshipDuration: {
      type: String,
      default: ''
    },
    issueDate: {
      type: String,
      required: [true, 'Please specify certificate issue date']
    },
    isDigitalRegistered: {
      type: Boolean,
      default: false
    },
    isPhysicalCopyGiven: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Certificate', CertificateSchema);
