const invoiceRepository = require('../repositories/invoiceRepository');
const studentRepository = require('../repositories/studentRepository');
const { NotFoundError, BadRequestError } = require('../utils/customErrors');
const mongoose = require('mongoose');

/**
 * Invoice Service - Handles invoice search, filtering, detail lookups, and downloads.
 */
class InvoiceService {
  /**
   * Fetch a paginated lists of invoices.
   * @param {Object} queryParams - Search terms, status filters, page indices.
   */
  async listInvoices(queryParams) {
    const { search, status, dateFilter, exactDate, page = 1, limit = 20 } = queryParams;
    const query = {};

    // 1. Status Filter
    if (status && status !== 'All') {
      query.status = status.toUpperCase();
    }

    // 2. Date Filters (Today, This Week, This Month, Exact Date)
    const now = new Date();
    if (exactDate) {
      const start = new Date(exactDate); start.setHours(0,0,0,0);
      const end = new Date(exactDate); end.setHours(23,59,59,999);
      query.issueDate = { $gte: start, $lte: end };
    } else if (dateFilter === 'today') {
      const start = new Date(now); start.setHours(0,0,0,0);
      const end = new Date(now); end.setHours(23,59,59,999);
      query.issueDate = { $gte: start, $lte: end };
    } else if (dateFilter === 'week') {
      const start = new Date(now);
      const day = now.getDay();
      start.setDate(now.getDate() - day);
      start.setHours(0,0,0,0);
      query.issueDate = { $gte: start };
    } else if (dateFilter === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0,0,0,0);
      query.issueDate = { $gte: start };
    }

    // 3. Global Search: Student Name, Student ID, Course, Invoice Number
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      const students = await studentRepository.aggregate([
        {
          $match: {
            deletedAt: null,
            $or: [
              { fullName: regex },
              { studentId: regex },
              { course: regex }
            ]
          }
        },
        { $project: { _id: 1 } }
      ]);
      const studentIds = students.map(s => s._id);

      query.$or = [
        { invoiceNumber: regex },
        { studentId: { $in: studentIds } }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const invoices = await invoiceRepository.findAndPaginate(query, skip, parseInt(limit, 10));
    const total = await invoiceRepository.count(query);

    return {
      invoices,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Fetch specific invoice by ID.
   * @param {string} id - Invoice DB ID.
   */
  async getInvoiceDetails(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid Invoice ID path provided.');
    }
    const invoice = await invoiceRepository.findById(id);
    if (!invoice) {
      throw new NotFoundError('Invoice record not found.');
    }
    return invoice;
  }

  /**
   * Simulate invoice PDF download.
   * @param {string} id - Invoice DB ID.
   */
  async downloadInvoice(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid Invoice ID.');
    }
    const invoice = await invoiceRepository.findById(id);
    if (!invoice) {
      throw new NotFoundError('Invoice record not found.');
    }
    return {
      fileUrl: `/invoices/download/${id}`,
      fileName: `${invoice.invoiceNumber}.pdf`
    };
  }
}

module.exports = new InvoiceService();
