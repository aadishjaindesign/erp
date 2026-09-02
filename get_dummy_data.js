const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const Student = require('./server/models/Student');
const Payment = require('./server/models/Payment');
const Invoice = require('./server/models/Invoice');
const FeePlan = require('./server/models/FeePlan');
const Receipt = require('./server/models/Receipt');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/erp-portal');
    console.log("Connected to MongoDB.");
    
    const students = await Student.find({}, 'name enrollmentNumber').lean();
    console.log("Total students:", students.length);
    console.log("Students:", students);
    
    const payments = await Payment.find({}, 'student transactionReference amount date').populate('student', 'name').lean();
    console.log("Total payments:", payments.length);
    
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
run();
