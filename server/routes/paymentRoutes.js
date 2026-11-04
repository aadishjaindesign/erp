const express = require('express');
const router = express.Router();
const {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  reconcileStudent,
  getPaymentsByStudent,
  getStudentActivityLogs
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/permissionMiddleware');
const { validatePaymentInput } = require('../validators/paymentValidator');

// Apply authentication protection and roles claim checks to all payment routes
router.use(protect);
router.use(authorize('access_fees'));

// Register endpoints
router.post('/', validatePaymentInput, createPayment);
router.get('/', getPayments);
router.get('/:id', getPaymentById);
router.put('/:id', updatePayment);
router.delete('/:id', deletePayment);
router.post('/reconcile/:studentId', reconcileStudent);
router.get('/student/:studentId', getPaymentsByStudent);
router.get('/logs/student/:studentId', getStudentActivityLogs);

module.exports = router;
