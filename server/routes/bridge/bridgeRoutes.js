const express = require('express');
const router = express.Router();
const bridgeAuth = require('../../middleware/bridgeAuth');
const {
  verifyAdmission,
  getStudentFeesByEnrollment
} = require('../../controllers/bridgeController');

// All Bridge routes require valid X-API-KEY header (M2M authentication)
router.use(bridgeAuth);

/**
 * Verification Endpoints (used during Student Registration on student.jainscomputer.com)
 */
router.post('/verify', verifyAdmission);
router.get('/verify', verifyAdmission);
router.post('/students/verify', verifyAdmission);

/**
 * Fee Sync Endpoints (used by LMS Student Portal & Background BullMQ Workers)
 */
router.get('/fees', getStudentFeesByEnrollment);
router.get('/students/:enrollmentNo/fees', getStudentFeesByEnrollment);
router.get('/fees/:enrollmentNo', getStudentFeesByEnrollment);
router.get('/:enrollmentNo', getStudentFeesByEnrollment);

module.exports = router;
