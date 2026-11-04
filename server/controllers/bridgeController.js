const Admission = require('../models/Admission');
const Student = require('../models/Student');
const FeePlan = require('../models/FeePlan');
const Installment = require('../models/Installment');
const Payment = require('../models/Payment');
const Receipt = require('../models/Receipt');

/**
 * Normalize phone number by extracting the last 10 digits
 */
const normalizePhone = (phone) => {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '').slice(-10);
};

/**
 * 1. Verify Admission / Student Record
 * Validates whether the given enrollment number exists in ERP (Admission or Student model)
 * and verifies that the provided phone number matches institute records.
 *
 * @route POST /api/bridge/verify
 * @route POST /api/bridge/students/verify
 */
const verifyAdmission = async (req, res) => {
  const startTime = Date.now();
  try {
    const rawEnrollment = req.body?.enrollmentNumber || req.body?.enrollmentNo || req.query?.enrollmentNumber || req.query?.enrollmentNo;
    const rawPhone = req.body?.phone || req.body?.mobile || req.query?.phone || req.query?.mobile;

    if (!rawEnrollment || !String(rawEnrollment).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Enrollment number is required.',
        code: 'MISSING_ENROLLMENT'
      });
    }

    const cleanEnrollment = String(rawEnrollment).trim();
    const cleanPhone = normalizePhone(rawPhone);

    // Optimized parallel lookup with .lean() and projections
    const [student, admission] = await Promise.all([
      Student.findOne({ studentId: cleanEnrollment, deletedAt: null })
        .select('studentId fullName mobile email course totalFees paymentPlan status createdAt')
        .lean(),
      Admission.findOne({ enrollmentNo: cleanEnrollment })
        .select('enrollmentNo fullName contact alternateNumber email courses totalFees advancePaid remainingFees paymentPlan paymentStatus createdAt')
        .lean()
    ]);

    if (!student && !admission) {
      return res.status(404).json({
        success: false,
        message: `No active admission or student record found for enrollment number "${cleanEnrollment}".`,
        code: 'ENROLLMENT_NOT_FOUND',
        data: { verified: false }
      });
    }

    // Determine target record values
    const erpPhone = normalizePhone(student?.mobile || admission?.contact || admission?.alternateNumber);
    const fullName = student?.fullName || admission?.fullName;
    const email = student?.email || admission?.email || '';
    const course = student?.course || (admission?.courses && admission.courses.length > 0 ? admission.courses.join(', ') : 'General');
    const courses = admission?.courses || (student?.course ? [student.course] : []);
    const totalFees = Number(student?.totalFees ?? admission?.totalFees ?? 0);
    const paymentPlan = student?.paymentPlan || admission?.paymentPlan || 'INSTALLMENT';
    const status = student?.status || 'ACTIVE';

    // Verify phone match if phone was supplied
    if (cleanPhone) {
      const altPhone = normalizePhone(admission?.alternateNumber);
      const isPhoneMatch = erpPhone === cleanPhone || (altPhone && altPhone === cleanPhone);

      if (!isPhoneMatch) {
        return res.status(400).json({
          success: false,
          message: 'The mobile number provided does not match the institute ERP admission record.',
          code: 'PHONE_MISMATCH',
          data: {
            verified: false,
            enrollmentNumber: cleanEnrollment
          }
        });
      }
    }

    const latencyMs = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      message: 'Student admission verified successfully.',
      latencyMs,
      data: {
        verified: true,
        enrollmentNumber: cleanEnrollment,
        fullName,
        phone: student?.mobile || admission?.contact || '',
        email,
        course,
        courses,
        totalFees,
        paymentPlan,
        status,
        admissionDate: student?.createdAt || admission?.createdAt || new Date()
      }
    });
  } catch (error) {
    console.error('❌ Bridge Verify Admission Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while verifying admission.',
      error: error.message
    });
  }
};

/**
 * 2. Get Student Fees by Enrollment Number
 * Aggregates FeePlan, Installments schedule, and Payment/Receipt history for LMS synchronization.
 *
 * @route GET /api/bridge/students/:enrollmentNo/fees
 * @route GET /api/bridge/fees/:enrollmentNo
 */
const getStudentFeesByEnrollment = async (req, res) => {
  const startTime = Date.now();
  try {
    const rawEnrollment = req.params.enrollmentNo || req.params.enrollmentNumber || req.query.enrollmentNo || req.query.enrollmentNumber;

    if (!rawEnrollment || !String(rawEnrollment).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Enrollment number parameter is required.',
        code: 'MISSING_ENROLLMENT'
      });
    }

    const cleanEnrollment = String(rawEnrollment).trim();

    // 1. Fetch Student profile or Admission profile
    const student = await Student.findOne({ studentId: cleanEnrollment, deletedAt: null })
      .select('_id studentId fullName mobile email course totalFees paymentPlan status')
      .lean();

    let feePlan = null;
    let installments = [];
    let payments = [];
    let receipts = [];

    if (student) {
      // Parallel fetch with .lean() and exact field projections for millisecond execution
      [feePlan, installments, payments, receipts] = await Promise.all([
        FeePlan.findOne({ studentId: student._id, deletedAt: null })
          .select('totalFees paidAmount remainingAmount paymentPlan numberOfInstallments installmentAmount firstDueDate status')
          .lean(),
        Installment.find({ studentId: student._id, deletedAt: null })
          .select('installmentNo amount dueDate paidDate paidAmount remainingAmount status remarks')
          .sort({ installmentNo: 1 })
          .lean(),
        Payment.find({ studentId: student._id })
          .select('_id amount paymentMode paymentType paymentDate transactionId remarks')
          .sort({ paymentDate: -1 })
          .lean(),
        Receipt.find({ studentId: student._id })
          .select('receiptNumber paymentId amount paymentMode generatedDate')
          .sort({ generatedDate: -1 })
          .lean()
      ]);
    } else {
      // Fallback: Check if student exists in Admission module (e.g. newly admitted)
      const admission = await Admission.findOne({ enrollmentNo: cleanEnrollment })
        .select('enrollmentNo fullName contact email courses totalFees advancePaid remainingFees paymentPlan paymentStatus emiSchedule createdAt')
        .lean();

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: `Student with enrollment number "${cleanEnrollment}" was not found.`,
          code: 'STUDENT_NOT_FOUND'
        });
      }

      // Structure admission data into standardized bridge format
      const totalFees = Number(admission.totalFees || 0);
      const paidAmount = Number(admission.advancePaid || 0);
      const dueAmount = Number(admission.remainingFees ?? Math.max(0, totalFees - paidAmount));
      const status = admission.paymentStatus || (dueAmount === 0 ? 'PAID' : (paidAmount > 0 ? 'PARTIAL' : 'PENDING'));

      const rawSchedule = Array.isArray(admission.emiSchedule) ? admission.emiSchedule : [];
      const admissionInstallments = rawSchedule.map((emi, idx) => ({
        installmentNo: Number(emi.installmentNumber ?? idx + 1),
        dueDate: emi.dueDate || new Date(),
        amount: Number(emi.amount ?? 0),
        paidAmount: 0,
        remainingAmount: Number(emi.amount ?? 0),
        status: 'PENDING'
      }));

      const paymentHistory = paidAmount > 0 ? [{
        receiptNo: `REC-${cleanEnrollment}-INIT`,
        amount: paidAmount,
        date: admission.createdAt || new Date(),
        mode: 'UPI',
        note: 'Advance payment collected during admission'
      }] : [];

      const nextDueDate = admissionInstallments.find(i => i.status !== 'PAID')?.dueDate || null;
      const latencyMs = Date.now() - startTime;

      return res.status(200).json({
        success: true,
        message: 'Student fee summary retrieved successfully from Admission records.',
        latencyMs,
        data: {
          enrollmentNo: cleanEnrollment,
          studentName: admission.fullName,
          studentPhone: admission.contact,
          course: (admission.courses && admission.courses.length > 0) ? admission.courses.join(', ') : 'N/A',
          totalFees,
          paidAmount,
          dueAmount,
          status,
          nextDueDate,
          installments: admissionInstallments,
          paymentHistory
        }
      });
    }

    // Map receipts lookup by payment ID
    const receiptMap = new Map();
    receipts.forEach((r) => {
      if (r.paymentId) {
        receiptMap.set(String(r.paymentId), r.receiptNumber);
      }
    });

    // Clean installments mapping
    const mappedInstallments = installments.map((inst, idx) => {
      const amount = Number(inst.amount ?? 0);
      const instPaid = Number(inst.paidAmount ?? 0);
      const remainingAmount = Number(inst.remainingAmount ?? Math.max(0, amount - instPaid));

      return {
        installmentNo: Number(inst.installmentNo ?? idx + 1),
        dueDate: inst.dueDate || new Date(),
        amount,
        paidAmount: instPaid,
        remainingAmount,
        paidDate: inst.paidDate || null,
        status: String(inst.status || 'PENDING').toUpperCase()
      };
    });

    // Clean payment history mapping
    const paymentHistory = payments.map((p, idx) => ({
      receiptNo: receiptMap.get(String(p._id)) || `REC-${cleanEnrollment}-${idx + 1}`,
      amount: Number(p.amount ?? 0),
      date: p.paymentDate || new Date(),
      mode: String(p.paymentMode || 'Cash').toUpperCase(),
      note: p.remarks || p.paymentType || 'Course Fee Payment'
    }));

    // Financial summaries
    const totalFees = Number(feePlan?.totalFees ?? student.totalFees ?? 0);
    const paidAmount = Number(feePlan?.paidAmount ?? payments.reduce((acc, p) => acc + (p.amount || 0), 0));
    const dueAmount = Number(feePlan?.remainingAmount ?? Math.max(0, totalFees - paidAmount));
    const status = feePlan?.status || (dueAmount === 0 ? 'PAID' : (paidAmount > 0 ? 'PARTIAL' : 'PENDING'));

    const nextDueDate = mappedInstallments.find(i => i.status !== 'PAID')?.dueDate || null;
    const latencyMs = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      message: 'Student fee summary retrieved successfully.',
      latencyMs,
      data: {
        enrollmentNo: cleanEnrollment,
        studentName: student.fullName,
        studentPhone: student.mobile,
        course: student.course || 'N/A',
        totalFees,
        paidAmount,
        dueAmount,
        status,
        nextDueDate,
        installments: mappedInstallments,
        paymentHistory
      }
    });
  } catch (error) {
    console.error('❌ Bridge Get Student Fees Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching student fees.',
      error: error.message
    });
  }
};

module.exports = {
  verifyAdmission,
  getStudentFeesByEnrollment
};

