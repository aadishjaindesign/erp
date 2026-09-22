const Certificate = require('../../models/Certificate');
const Student = require('../../models/Student');
const FeePlan = require('../../models/FeePlan');

// @desc    Create a new certificate
// @route   POST /api/certificates
// @access  Private (Admin)
exports.createCertificate = async (req, res, next) => {
  try {
    const {
      studentName,
      enrollmentNumber,
      course,
      courseIssueDate,
      duration,
      internship,
      internshipDuration,
      issueDate
    } = req.body;

    if (!studentName || !enrollmentNumber || !course || !courseIssueDate || !duration || !internship || !issueDate) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields.' });
    }

    // Check duplicate enrollment number
    const existing = await Certificate.findOne({ enrollmentNumber: enrollmentNumber.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A certificate with this enrollment number already exists.' });
    }

    const certificate = await Certificate.create({
      studentName: studentName.trim(),
      enrollmentNumber: enrollmentNumber.trim(),
      course: course.trim(),
      courseIssueDate: courseIssueDate.trim(),
      duration: duration.trim(),
      internship,
      internshipDuration: internshipDuration ? internshipDuration.trim() : '',
      issueDate: issueDate.trim(),
      status: req.body.status || 'Active'
    });

    // Enqueue certificate issued notification via BullMQ
    const notificationService = require('../../services/notificationService');
    const { addEmailJob } = require('../../queues/queueManager');

    notificationService.create({
      isAdmin: true,
      title: 'Certificate Issued',
      message: `Certificate issued for ${studentName.trim()} (${enrollmentNumber.trim()}) - ${course.trim()}.`,
      module: 'Academics',
      type: 'SUCCESS',
      priority: 'MEDIUM',
      actionUrl: '/certificates'
    }).catch(e => console.warn('[CertificateController] Notification enqueue warning:', e.message));

    if (req.body.email) {
      addEmailJob('certificate-email', {
        type: 'CERTIFICATE_ISSUED',
        to: req.body.email,
        subject: `Your Certificate for ${course.trim()} has been issued`,
        data: {
          studentName: studentName.trim(),
          enrollmentNumber: enrollmentNumber.trim(),
          course: course.trim(),
          issueDate: issueDate.trim()
        }
      }).catch(e => console.warn('[CertificateController] Email enqueue warning:', e.message));
    }

    return res.status(201).json({
      success: true,
      message: 'Certificate created successfully.',
      data: certificate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all certificates
// @route   GET /api/certificates
// @access  Private (Admin)
exports.getCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find().sort({ createdAt: -1 }).lean();
    
    // Attach fee payment status to each certificate
    const enhancedCertificates = await Promise.all(certificates.map(async (cert) => {
      let isFeesPaid = false;
      const student = await Student.findOne({ studentId: cert.enrollmentNumber });
      
      if (student) {
        const feePlan = await FeePlan.findOne({ studentId: student._id });
        if (feePlan && feePlan.status === 'PAID') {
          isFeesPaid = true;
        }
      }
      
      // For old data or manually activated certificates, if it's active, treat fees as paid
      if (cert.status === 'Active') {
        isFeesPaid = true;
      }

      return { ...cert, isFeesPaid };
    }));

    return res.status(200).json({
      success: true,
      data: enhancedCertificates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a certificate
// @route   PUT /api/certificates/:id
// @access  Private (Admin)
exports.updateCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate record not found.' });
    }

    const {
      studentName,
      enrollmentNumber,
      course,
      courseIssueDate,
      duration,
      internship,
      internshipDuration,
      issueDate,
      isDigitalRegistered,
      isPhysicalCopyGiven
    } = req.body;

    // Check duplicate if enrollment number changes
    if (enrollmentNumber && enrollmentNumber.trim() !== certificate.enrollmentNumber) {
      const existing = await Certificate.findOne({ enrollmentNumber: enrollmentNumber.trim() });
      if (existing) {
        return res.status(400).json({ success: false, message: 'A certificate with this enrollment number already exists.' });
      }
      certificate.enrollmentNumber = enrollmentNumber.trim();
    }

    if (studentName) certificate.studentName = studentName.trim();
    if (course) certificate.course = course.trim();
    if (courseIssueDate) certificate.courseIssueDate = courseIssueDate.trim();
    if (duration) certificate.duration = duration.trim();
    if (internship) certificate.internship = internship;
    if (internshipDuration !== undefined) certificate.internshipDuration = internshipDuration.trim();
    if (issueDate) certificate.issueDate = issueDate.trim();
    
    if (isDigitalRegistered !== undefined) certificate.isDigitalRegistered = isDigitalRegistered;
    if (isPhysicalCopyGiven !== undefined) certificate.isPhysicalCopyGiven = isPhysicalCopyGiven;
    if (req.body.status) certificate.status = req.body.status;

    await certificate.save();

    return res.status(200).json({
      success: true,
      message: 'Certificate details updated successfully.',
      data: certificate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a certificate
// @route   DELETE /api/certificates/:id
// @access  Private (Admin)
exports.deleteCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate record not found.' });
    }

    await Certificate.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Certificate deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify a certificate (Public)
// @route   GET /api/certificates/verify
// @access  Public
exports.verifyCertificate = async (req, res, next) => {
  try {
    const { enrollmentNumber } = req.query;
    if (!enrollmentNumber) {
      return res.status(400).json({ success: false, message: 'Please specify the enrollment number to verify.' });
    }

    // Exact search or normalized search
    const cleanEnroll = enrollmentNumber.trim().toUpperCase();
    const certificate = await Certificate.findOne({
      enrollmentNumber: { $regex: new RegExp('^' + cleanEnroll.replace(/\//g, '\\/') + '$', 'i') },
      status: 'Active'
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'No active certificate found matching the provided enrollment number.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Certificate verified successfully. ✅',
      data: certificate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify a certificate by year and number
// @route   GET /api/certificates/verify/:year/:number
// @access  Public
exports.verifyCertificateByParams = async (req, res, next) => {
  try {
    const { year, number } = req.params;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const enrollment = `RJ/${fullYear}/${number}`;

    const certificate = await Certificate.findOne({
      enrollmentNumber: { $regex: enrollment, $options: 'i' },
      status: 'Active'
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'No active certificate found matching the provided enrollment details.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Certificate verified successfully. ✅',
      data: certificate
    });
  } catch (error) {
    next(error);
  }
};
