const mongoose = require('mongoose');

// The Attendance DB URI will default to ATTENDANCE_MONGO_URI
// If not provided, it falls back to MONGO_URI
const uri = process.env.ATTENDANCE_MONGO_URI || process.env.MONGO_URI;

// We use createConnection for the secondary DB to avoid interfering with the default connection
const attendanceDb = mongoose.createConnection(uri, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000
});

attendanceDb.on('connected', () => {
  console.log(`[MongoDB] Successfully connected to ATTENDANCE database: ${attendanceDb.host}`);
});

attendanceDb.on('error', (err) => {
  console.error('[MongoDB Error - Attendance]', err.message);
});

attendanceDb.on('disconnected', () => {
  console.warn('[MongoDB] Attendance Connection state: DISCONNECTED');
});

module.exports = attendanceDb;
