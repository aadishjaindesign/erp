const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Please specify the holiday date'],
      unique: true
    },
    reason: {
      type: String,
      required: [true, 'Please specify the occasion/reason']
    }
  },
  { timestamps: true }
);

const attendanceDb = require('../config/attendanceDb');
module.exports = attendanceDb.model('Holiday', HolidaySchema);
