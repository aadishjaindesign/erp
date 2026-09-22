const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add department name'],
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Please add department code'],
      unique: true,
      trim: true
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: false
    },
    description: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

const attendanceDb = require('../config/attendanceDb');
module.exports = attendanceDb.model('Department', DepartmentSchema);
