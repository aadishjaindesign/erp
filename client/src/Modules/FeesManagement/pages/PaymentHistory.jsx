import React, { useState } from 'react';
import { RefreshCw, Edit2, Trash2, X } from 'lucide-react';
import CommonTable from '../components/CommonTable';
import FilterPanel from '../components/FilterPanel';
import StatusBadge from '../components/StatusBadge';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import { usePayments } from '../hooks/usePayments';
import { formatDate } from '../../../utils/dateUtils';

const PaymentHistory = () => {
  const { payments, loading, error, refetchPayments, updatePayment, deletePayment } = usePayments();
  const [paymentModeFilter, setPaymentModeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  // Edit Payment State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [editForm, setEditForm] = useState({
    amount: '',
    paymentMode: 'UPI',
    paymentType: 'INSTALLMENT_PAYMENT',
    remarks: '',
    transactionId: '',
    paymentDate: ''
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete Payment State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openEditModal = (rec) => {
    setEditingPayment(rec);
    setEditForm({
      amount: rec.amount || '',
      paymentMode: rec.paymentMode || 'UPI',
      paymentType: rec.paymentType || 'INSTALLMENT_PAYMENT',
      remarks: rec.remarks || '',
      transactionId: rec.transactionId || '',
      paymentDate: rec.paymentDate ? new Date(rec.paymentDate).toISOString().split('T')[0] : ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.amount || parseFloat(editForm.amount) <= 0) {
      showToast('Please enter a valid amount.', 'error');
      return;
    }
    setEditSubmitting(true);
    try {
      await updatePayment(editingPayment._id, editForm);
      showToast('Payment updated & student dues recalculated!');
      setIsEditModalOpen(false);
      refetchPayments();
    } catch (err) {
      showToast(err.userMessage || err.response?.data?.message || 'Failed to update payment.', 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      await deletePayment(deleteTarget._id);
      showToast('Payment deleted & dues recalculated!');
      setDeleteTarget(null);
      refetchPayments();
    } catch (err) {
      showToast(err.userMessage || err.response?.data?.message || 'Failed to delete payment.', 'error');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Format currency
  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Filter payment receipts
  const filteredReceipts = payments.filter((rec) => {
    const receiptNo = rec.receipt?.receiptNumber || '';
    const studentName = rec.student?.fullName || '';
    const transactionId = rec.transactionId || '';
    const studentId = rec.student?.studentId || '';
    const paymentMode = rec.paymentMode || '';

    const matchesMode = paymentModeFilter === 'All' || paymentMode === paymentModeFilter;
    const matchesSearch =
      receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transactionId.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesMode && matchesSearch;
  });

  const columns = [
    {
      header: 'Receipt ID',
      accessor: 'receipt.receiptNumber',
      render: (rec) => <span className="font-mono text-amber-600 font-bold">{rec.receipt?.receiptNumber || 'N/A'}</span>
    },
    {
      header: 'Student ID',
      accessor: 'student.studentId',
      render: (rec) => <span className="font-mono text-slate-500">{rec.student?.studentId || 'N/A'}</span>
    },
    {
      header: 'Student Name',
      accessor: 'student.fullName',
      render: (rec) => (
        <div>
          <div className="font-bold text-slate-800">{rec.student?.fullName || 'N/A'}</div>
          <div className="text-[10px] text-slate-400 font-semibold">{rec.student?.course || 'N/A'}</div>
        </div>
      )
    },
    {
      header: 'Received Amount',
      accessor: 'amount',
      render: (rec) => (
        <div>
          <span className="text-emerald-600 font-extrabold">{formatINR(rec.amount)}</span>
          {rec.advanceAmount > 0 && (
            <span className="block text-[9px] text-blue-600 font-bold">
              +{formatINR(rec.advanceAmount)} Extra Credit
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'paymentType',
      render: (rec) => (
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
          {rec.paymentType?.replace('_', ' ') || 'PAYMENT'}
        </span>
      )
    },
    {
      header: 'Payment Mode',
      accessor: 'paymentMode',
      render: (rec) => (
        <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold">
          {rec.paymentMode}
        </span>
      )
    },
    {
      header: 'Transaction Ref',
      accessor: 'transactionId',
      render: (rec) => <span className="font-mono text-slate-500">{rec.transactionId || 'Cash/Direct'}</span>
    },
    {
      header: 'Processed Date',
      accessor: 'paymentDate',
      render: (rec) => <span className="text-slate-500">{formatDate(rec.paymentDate)}</span>
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (rec) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => openEditModal(rec)}
            className="p-1.5 rounded-lg border border-[#DEDCD8] bg-white text-blue-600 hover:bg-blue-50 transition-all cursor-pointer shadow-2xs"
            title="Edit payment amount / mode"
          >
            <Edit2 size={12} />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(rec)}
            className="p-1.5 rounded-lg border border-[#DEDCD8] bg-white text-rose-600 hover:bg-rose-50 transition-all cursor-pointer shadow-2xs"
            title="Delete payment & recalculate"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )
    }
  ];

  const dropdownFilters = (
    <FilterPanel showIcon={true}>
      <select
        value={paymentModeFilter}
        onChange={(e) => setPaymentModeFilter(e.target.value)}
        className="bg-transparent border-none outline-none text-xs font-bold cursor-pointer text-slate-700"
      >
        <option value="All">All Channels</option>
        <option value="UPI">UPI</option>
        <option value="Bank Transfer">Bank Transfer</option>
        <option value="Cash">Cash</option>
      </select>
    </FilterPanel>
  );

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold transition-all border flex items-center gap-2 animate-fade-in ${
          toast.type === 'error' 
            ? 'bg-rose-50 border-rose-100 text-rose-600' 
            : 'bg-emerald-50 border-emerald-100 text-emerald-600'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Action panel */}
      <div className="flex justify-between items-center bg-white p-4 border border-[#EBEAE6] rounded-2xl shadow-sm">
        <div className="space-y-0.5">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Collections Audit Trail</h3>
          <p className="text-[10px] font-semibold text-slate-400">Total Payments Audited: {filteredReceipts.length}</p>
        </div>
        <button 
          onClick={refetchPayments}
          className="p-2 border border-[#DEDCD8] bg-white text-slate-500 rounded-xl hover:bg-[#FAF9F6] transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && <ErrorState message={error} onRetry={refetchPayments} />}

      {/* History table */}
      <CommonTable
        columns={columns}
        data={filteredReceipts}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search Receipt, Student, Invoice, Transaction..."
        emptyMessage="No payment entries matched your filters."
        filters={dropdownFilters}
        showPagination={false}
      />

      {/* Edit Payment Modal */}
      {isEditModalOpen && editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-[#EBEAE6] rounded-3xl shadow-2xl p-6 space-y-4">
            
            <div className="flex justify-between items-center pb-3 border-b border-[#FAF9F6]">
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Edit Payment Entry</h4>
                <p className="text-[10px] text-slate-400 font-medium">Recalculates student's dues and installment statuses automatically.</p>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg border border-slate-200 hover:bg-[#FAF9F6] text-slate-400 hover:text-slate-600 transition-all cursor-pointer outline-none"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-bold text-slate-655">
              
              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-slate-400 font-bold">Payment Amount (₹) *</label>
                <input 
                  type="number"
                  min="1"
                  step="any"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DEDCD8] rounded-xl font-extrabold text-slate-800 text-sm outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="flex flex-wrap gap-3.5">
                <div className="space-y-1 flex-1">
                  <label className="block text-[10px] uppercase text-slate-400 font-bold">Payment Mode</label>
                  <select 
                    value={editForm.paymentMode}
                    onChange={(e) => setEditForm({ ...editForm, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DEDCD8] bg-white rounded-xl font-bold cursor-pointer outline-none focus:border-amber-400"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash Sale</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Card">Card</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>

                <div className="space-y-1 flex-1">
                  <label className="block text-[10px] uppercase text-slate-400 font-bold">Payment Type</label>
                  <select 
                    value={editForm.paymentType}
                    onChange={(e) => setEditForm({ ...editForm, paymentType: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DEDCD8] bg-white rounded-xl font-bold cursor-pointer outline-none focus:border-amber-400"
                  >
                    <option value="INSTALLMENT_PAYMENT">Installment Payment</option>
                    <option value="INITIAL_PAYMENT">Initial / Admission</option>
                    <option value="PARTIAL_PAYMENT">Partial Payment</option>
                    <option value="ADVANCE_PAYMENT">Advance Payment</option>
                    <option value="FULL_PAYMENT">Full Plan Settlement</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-slate-400 font-bold">Payment Date</label>
                <input 
                  type="date"
                  value={editForm.paymentDate}
                  onChange={(e) => setEditForm({ ...editForm, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DEDCD8] bg-white rounded-xl font-semibold outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-slate-400 font-bold">Transaction / Ref ID</label>
                <input 
                  type="text"
                  value={editForm.transactionId}
                  onChange={(e) => setEditForm({ ...editForm, transactionId: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DEDCD8] rounded-xl font-semibold outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-slate-400 font-bold">Remarks / Notes</label>
                <input 
                  type="text"
                  value={editForm.remarks}
                  onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DEDCD8] rounded-xl font-semibold outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={editSubmitting}
                  className="w-full py-2 border border-[#DEDCD8] bg-white text-slate-600 hover:bg-[#FAF9F6] rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {editSubmitting ? <RefreshCw size={12} className="animate-spin" /> : null}
                  <span>Update & Recalculate</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Payment Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white border border-[#EBEAE6] rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 size={24} />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-sm font-black text-slate-800">Delete Payment?</h4>
              <p className="text-xs text-slate-500 font-medium">
                Delete payment of <span className="font-extrabold text-slate-800">{formatINR(deleteTarget.amount)}</span> for {deleteTarget.student?.fullName || 'student'}?
              </p>
              <p className="text-[11px] text-amber-600 font-semibold bg-amber-50 p-2 rounded-xl mt-2 border border-amber-100">
                The student's fee plan and installments will be automatically recalculated.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteSubmitting}
                className="w-full py-2.5 border border-[#DEDCD8] bg-white text-slate-600 hover:bg-[#FAF9F6] rounded-xl font-bold cursor-pointer disabled:opacity-50 text-xs"
              >
                Keep Payment
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteSubmitting}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 text-xs"
              >
                {deleteSubmitting ? <RefreshCw size={12} className="animate-spin" /> : null}
                <span>Delete & Recalculate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
