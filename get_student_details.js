const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });
const Student = require('./server/models/Student');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/erp-portal');
    console.log("Connected to MongoDB.");
    
    const students = await Student.find({}, 'fullName studentId').lean();
    console.log("Students details:", students);
    
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
run();
