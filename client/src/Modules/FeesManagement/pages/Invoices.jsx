import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Eye, X, RefreshCw, GraduationCap, ChevronDown, ChevronRight } from 'lucide-react';
import { useSystemSettings } from '../context/SettingsContext';
import { feesApi } from '../../../api/feesApi';
import CommonTable from '../components/CommonTable';
import StatusBadge from '../components/StatusBadge';
import FilterPanel from '../components/FilterPanel';
import DatePicker from '../components/DatePicker';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';

const Invoices = () => {
  const { settings } = useSystemSettings();
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('All'); // All, today, week, month
  const [exactDate, setExactDate] = useState('');

  // Data states
  const [invoicesList, setInvoicesList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [activeInstallments, setActiveInstallments] = useState([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 20,
        status: statusFilter === 'All' ? undefined : statusFilter,
        dateFilter: dateFilter === 'All' ? undefined : dateFilter,
        exactDate: exactDate || undefined,
        search: searchQuery === '' ? undefined : searchQuery
      };
      const res = await feesApi.getInvoices(params);
      if (res.success) {
        setInvoicesList(res.data.invoices || []);
        setTotalCount(res.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to fetch billing invoices from database.');
    } finally {
      setLoading(false);
    }
  };

  const loadInvoiceDetails = async (id) => {
    setModalLoading(true);
    setActiveInstallments([]); // Reset previous installments list
    try {
      const res = await feesApi.getInvoiceById(id);
      if (res.success) {
        setActiveInvoice(res.data);

        // Fetch installments for this student
        if (res.data.studentId?._id) {
          const instRes = await feesApi.getInstallmentsByStudent(res.data.studentId._id);
          if (instRes.success) {
            setActiveInstallments(instRes.data.installmentList || []);
          }
        }
      }
    } catch (err) {
      console.error('Error loading invoice details:', err);
      showToast('Failed to load invoice details.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, statusFilter, dateFilter, exactDate]);

  // Format currency
  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === '-') return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handlePrint = () => {
    window.print();
  };


  const groupedInvoices = useMemo(() => {
    const map = new Map();
    invoicesList.forEach(inv => {
      const sId = inv.studentId?._id || 'unknown';
      if (!map.has(sId)) {
        map.set(sId, {
          _id: sId,
          studentId: inv.studentId,
          invoices: []
        });
      }
      map.get(sId).invoices.push(inv);
    });

    const groups = Array.from(map.values());
    groups.forEach(g => {
      g.invoices.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      const pending = g.invoices.filter(i => i.status === 'PENDING');
      g.summaryInvoice = pending.length > 0 ? pending[0] : g.invoices[0];

      // Add a searchable string for CommonTable's local filter
      const invNumbers = g.invoices.map(i => i.invoiceNumber).join(' ');
      g.searchString = `${g.studentId?.fullName || ''} ${g.studentId?.studentId || ''} ${g.studentId?.course || ''} ${invNumbers}`;
    });
    return groups;
  }, [invoicesList]);

  const columns = useMemo(() => [
    {
      header: 'Student Name',
      accessor: 'studentName',
      render: (group, isExpanded) => (
        <div className="flex items-center gap-3">
          {isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
          <div>
            <div className="font-bold text-slate-800">{group.studentId?.fullName || 'N/A'}</div>
            <span className="text-[10px] text-slate-400 font-semibold">{group.studentId?.studentId || 'N/A'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Course',
      accessor: 'course',
      render: (group) => <span className="text-slate-650">{group.studentId?.course || 'N/A'}</span>
    },
    {
      header: 'Total EMIs',
      accessor: 'count',
      render: (group) => {
        const pendingCount = group.invoices.filter(i => i.status === 'PENDING').length;
        return <span className="font-semibold text-slate-655">{group.invoices.length} Total ({pendingCount} Pending)</span>;
      }
    },
    {
      header: 'Next Amount Due',
      accessor: 'amount',
      render: (group) => <span className="font-extrabold text-slate-800">{formatINR(group.summaryInvoice?.amount)}</span>
    },
    {
      header: 'Next Due Date',
      accessor: 'dueDate',
      render: (group) => <span className="text-slate-500 font-semibold">{formatDate(group.summaryInvoice?.dueDate)}</span>
    },
    {
      header: 'Summary Status',
      accessor: 'status',
      render: (group) => <StatusBadge status={group.summaryInvoice?.status} />
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (group) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => loadInvoiceDetails(group.summaryInvoice?._id)}
            className="p-1.5 rounded-lg border border-[#DEDCD8] bg-white text-slate-655 hover:bg-[#FAF9F6] transition-all cursor-pointer"
            title="Preview Latest Invoice"
          >
            <Eye size={14} />
          </button>
        </div>
      )
    }
  ], []);

  const renderExpandedRow = (group) => (
    <div className="p-4 pl-12 bg-white/50 space-y-2">
      <h4 className="text-xs font-bold text-slate-600 mb-2">EMI Schedule for {group.studentId?.fullName || 'N/A'}</h4>
      <div className="border border-slate-150 rounded-xl overflow-hidden">
        <table className="w-full text-left text-[11px] font-semibold text-slate-650">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-150 text-[10px] text-slate-500 uppercase tracking-wider">
              <th className="px-4 py-2">Invoice ID</th>
              <th className="px-4 py-2">Issue Date</th>
              <th className="px-4 py-2">Due Date</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2 text-center">Status</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {group.invoices.map(inv => (
              <tr key={inv._id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-mono font-bold">{inv.invoiceNumber}</td>
                <td className="px-4 py-2">{formatDate(inv.issueDate)}</td>
                <td className="px-4 py-2 text-brand-red">{formatDate(inv.dueDate)}</td>
                <td className="px-4 py-2 text-right font-extrabold text-slate-800">{formatINR(inv.amount)}</td>
                <td className="px-4 py-2 text-center"><StatusBadge status={inv.status} /></td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); loadInvoiceDetails(inv._id); }}
                    className="p-1 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-500"
                    title="View Invoice"
                  >
                    <Eye size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const dropdownFilters = (
    <FilterPanel showIcon={true}>
      <DatePicker
        selectedDate={exactDate}
        onChange={(date) => {
          setExactDate(date);
          setDateFilter('All');
        }}
        placeholder="Select Exact Date"
        className="w-36 text-xs py-1 px-2 border-none bg-transparent"
      />
      <div className="w-px h-4 bg-slate-200 mx-1"></div>
      <select
        value={dateFilter}
        onChange={(e) => setDateFilter(e.target.value)}
        className="bg-transparent border-none outline-none text-xs font-bold cursor-pointer text-slate-700"
      >
        <option value="All">All Dates</option>
        <option value="today">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
      </select>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="bg-transparent border-none outline-none text-xs font-bold cursor-pointer text-slate-700"
      >
        <option value="All">All Statuses</option>
        <option value="Paid">Paid</option>
        <option value="Pending">Pending</option>
        <option value="Overdue">Overdue</option>
      </select>
    </FilterPanel>
  );

  return (
    <div className="space-y-4 print:p-0 print:bg-white print:text-black">

      {/* Toast notifications */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold border flex items-center gap-2 animate-fade-in ${toast.type === 'error'
            ? 'bg-rose-50 border-rose-100 text-rose-600'
            : 'bg-emerald-50 border-emerald-100 text-emerald-600'
          }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header action panel */}
      <div className="flex justify-between items-center bg-white p-4 border border-[#EBEAE6] rounded-2xl shadow-sm print:hidden">
        <div className="space-y-0.5">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Fee Demands & Invoices</h3>
          <p className="text-[10px] font-semibold text-slate-400">Total Demands generated: {totalCount}</p>
        </div>
        <button
          onClick={fetchInvoices}
          className="p-2 border border-[#DEDCD8] bg-white text-slate-500 rounded-xl hover:bg-[#FAF9F6] transition-all cursor-pointer shadow-xs active:scale-95"
          title="Refresh invoices"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && <ErrorState message={error} onRetry={fetchInvoices} />}

      <div className="print:hidden">
        <CommonTable
          columns={columns}
          data={groupedInvoices}
          expandable={true}
          renderExpandedRow={renderExpandedRow}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search Invoice No, Student Name, Student ID..."
          emptyMessage="No billing invoices found matching selection."
          filters={dropdownFilters}
          itemsPerPage={20}
        />
      </div>

      {/* Invoice Modal Preview Drawer */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print:relative print:inset-auto print:bg-white print:p-0">
          <div className="relative w-full max-w-[800px] bg-white border border-[#EBEAE6] shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col p-8 font-sans print:border-none print:shadow-none print:max-h-full print:w-full print:p-0 text-black">

            <style>{`
                @media print {
                  aside, nav, footer, header, .print\\:hidden, button {
                    display: none !important;
                  }
                  html, body, #root, #root > div, main {
                    background: white !important;
                    color: black !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    height: auto !important;
                    min-height: 0 !important;
                    overflow: visible !important;
                    display: block !important;
                    position: static !important;
                  }
                  body {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  .fixed.inset-0 {
                    position: static !important;
                    display: block !important;
                    background: transparent !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    backdrop-filter: none !important;
                    overflow: visible !important;
                  }
                }
              `}</style>

            <button
              onClick={() => setActiveInvoice(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors print:hidden z-10"
            >
              <X size={20} />
            </button>
            <button
              onClick={() => window.print()}
              className="absolute top-4 right-16 px-4 py-2 rounded-xl bg-brand-primary text-white font-bold text-xs hover:bg-brand-primary/90 transition-colors print:hidden z-10"
            >
              Print Invoice
            </button>

            {/* Exact Design Match Begins Here */}

            {/* Header */}
            <div className="flex justify-between items-start mb-6 pt-4">
              <div className="flex items-center">
                <img src="/jains.svg" alt="JAINS COMPUTER" className="h-16 object-contain" onError={(e) => { e.target.onerror = null; e.target.src = "/logo.png"; }} />
              </div>
              <div className="text-right">
                <div className="text-[12px] font-bold text-gray-800 mb-1">
                  Issue Date : {formatDate(activeInvoice.issueDate)}<br />
                  Invoice No.: {activeInvoice.invoiceNumber}
                </div>
                <div className="text-[10px] text-gray-500 leading-tight">
                  Contact: +91-7976451466, +91-6377075972<br />
                  Website: jainscomputer.com<br />
                  Address: 13A, Shivpuri, Indrapura, Jhotwara, Jaipur, Rajasthan 302012
                </div>
                <h1 className="text-6xl font-bold text-[#E31E24] mt-2 tracking-tight">Invoice</h1>
              </div>
            </div>

            {/* Details Boxes */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Student Box */}
              <div className="border-[1.5px] border-black flex flex-col h-full">
                <div className="bg-black text-white text-[13px] font-semibold px-4 py-1.5">
                  Student Details
                </div>
                <div className="p-4 text-[12px] space-y-1.5 flex-1">
                  <div><span className="font-bold">Enrollment No.:</span> {activeInvoice.studentId?.studentId || 'N/A'}</div>
                  <div><span className="font-bold">Name:</span> {activeInvoice.studentId?.fullName || 'N/A'}</div>
                  <div><span className="font-bold">Mobile Number:</span> {activeInvoice.studentId?.mobile || 'N/A'}</div>
                  <div><span className="font-bold">Email ID:</span> {activeInvoice.studentId?.email || 'N/A'}</div>
                  <div><span className="font-bold">D.O.B:</span> {activeInvoice.studentId?.dob ? formatDate(activeInvoice.studentId.dob) : 'N/A'}</div>
                  <div><span className="font-bold">Address:</span> {activeInvoice.studentId?.address || 'N/A'}</div>
                </div>
              </div>
              {/* Course Box */}
              <div className="border-[1.5px] border-black flex flex-col h-full">
                <div className="bg-black text-white text-[13px] font-semibold px-4 py-1.5">
                  Course Details
                </div>
                <div className="p-4 text-[12px] flex-1 flex flex-col justify-between">
                  <div>
                    <span className="font-bold">Enrolled Course:</span> {Array.isArray(activeInvoice.studentId?.courses) ? activeInvoice.studentId.courses.join(', ') : (activeInvoice.studentId?.course || 'N/A')}
                  </div>
                  <div className="font-bold mt-4">
                    Duration: <span className="font-normal">{activeInvoice.studentId?.courseDuration || 'N/A'} Months</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details Box */}
            <div className="border-[1.5px] border-black mb-[1px]">
              <div className="bg-black text-white text-[13px] font-semibold px-4 py-1.5">
                Payment Details
              </div>
              <table className="w-full text-center text-[11px] border-collapse">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b-[1.5px] border-black">
                    <th className="py-2.5 border-r-[1.5px] border-black">Installment</th>
                    <th className="py-2.5 border-r-[1.5px] border-black">Amount</th>
                    <th className="py-2.5 border-r-[1.5px] border-black">Payment Date</th>
                    <th className="py-2.5 border-r-[1.5px] border-black">Payment Mode</th>
                    <th className="py-2.5 border-r-[1.5px] border-black">Transaction ID</th>
                    <th className="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeInstallments.length > 0 ? activeInstallments : [{ _id: 'default', amount: activeInvoice.amount, status: activeInvoice.status, paidDate: activeInvoice.paidDate }]).map((inst, index) => {
                    const numStr = (index + 1) + (["st", "nd", "rd"][((index + 1) % 10) - 1] || "th");
                    const payment = (inst.payments || [])[0];
                    const isPaid = inst.status === 'PAID';
                    return (
                      <tr key={inst._id} className="border-b-[1.5px] border-gray-300">
                        <td className="py-2 border-r-[1.5px] border-black text-gray-700">{numStr} Installment</td>
                        <td className="py-2 border-r-[1.5px] border-black text-gray-700">Rs. {inst.amount}/-</td>
                        <td className="py-2 border-r-[1.5px] border-black text-gray-700">{isPaid && inst.paidDate ? formatDate(inst.paidDate) : (payment?.paymentDate ? formatDate(payment.paymentDate) : '-')}</td>
                        <td className="py-2 border-r-[1.5px] border-black text-gray-700">{payment?.paymentMode || '-'}</td>
                        <td className="py-2 border-r-[1.5px] border-black text-gray-700">{payment?.transactionId || '-'}</td>
                        <td className={`py-2 font-bold ${isPaid ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#991b1b]'}`}>
                          {isPaid ? 'Paid' : 'Due'}
                        </td>
                      </tr>
                    )
                  })}
                  {/* Empty Rows to match design height */}
                  {Array.from({ length: Math.max(0, 9 - (activeInstallments.length || 1)) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="border-b-[1.5px] border-gray-300">
                      <td className="py-4 border-r-[1.5px] border-black"></td>
                      <td className="py-4 border-r-[1.5px] border-black"></td>
                      <td className="py-4 border-r-[1.5px] border-black"></td>
                      <td className="py-4 border-r-[1.5px] border-black"></td>
                      <td className="py-4 border-r-[1.5px] border-black"></td>
                      <td className="py-4"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Fees */}
            <div className="bg-black text-white flex justify-between items-center px-4 py-2.5 text-[14px] font-bold border-[1.5px] border-black border-t-0">
              <div>Total Fees: <span className="font-normal">Rs. {
                activeInstallments.length > 0
                  ? activeInstallments.reduce((acc, inst) => acc + inst.amount, 0)
                  : activeInvoice.amount
              }/-</span></div>
              <div className="bg-gray-300 text-black px-3 py-0.5 rounded-[2px] text-[12px] font-bold">
                Due: <span className="font-normal">Rs. {
                  activeInstallments.length > 0
                    ? activeInstallments.filter(inst => inst.status !== 'PAID').reduce((acc, inst) => acc + (inst.amount - (inst.paidAmount || 0)), 0)
                    : (activeInvoice.status === 'PAID' ? 0 : activeInvoice.amount)
                }/-</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-between items-end">
              <div className="text-[10px] text-gray-500 w-2/3">
                <h5 className="font-bold text-gray-400 text-[11px] mb-1">Terms & Conditions</h5>
                <ol className="list-decimal pl-3 space-y-0.5">
                  <li>Fees once paid are non-refundable and non-transferable.</li>
                  <li>All installments must be paid on or before the due date.</li>
                  <li>Certificates will be issued only after full fee payment.</li>
                  <li>Late payments may result in suspension of classes or services.</li>
                  <li>Subject to Jaipur, Rajasthan jurisdiction only.</li>
                </ol>
              </div>
                <div className="flex gap-6 items-end relative pb-2">
                  {/* Official Stamp */}
                  <img src="/Jains Computer Stamp.png" alt="Seal" className="w-[80px] h-[80px] object-contain mix-blend-multiply opacity-90" onError={(e) => e.target.style.display = 'none'} />
                  
                  <div className="text-center w-32 flex flex-col items-center">
                    <img src="/AuthSingh.jpeg" className="h-[45px] object-contain mix-blend-multiply mb-1" alt="Signature" onError={(e) => e.target.style.display = 'none'} />
                    <div className="w-full border-t-[1.5px] border-black mb-1.5"></div>
                    <div className="text-[12px] font-bold text-black leading-none">Sanmati Jain</div>
                    <div className="text-[10px] font-medium text-gray-700 leading-none mt-1">Director</div>
                  </div>
                </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Invoices;