import React, { useState } from 'react';
import { Plus, List, Filter } from 'lucide-react';
import OfflineLeadForm from './OfflineLeadForm';
import { leadService } from '../services/leadService';
import { formatDate } from '../../../utils/dateUtils';

const LEAD_SOURCES = ['All', 'Website', 'YouTube', 'Instagram', 'Google', 'Walk-In', 'Friend / Referral', 'Other'];

const LEAD_TYPE_COLORS = {
  Cold: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Warm: 'bg-orange-100 text-orange-700 border-orange-200',
  Hot: 'bg-red-100 text-red-700 border-red-200',
  Sale: 'bg-green-100 text-green-700 border-green-200'
};

export default function OfflineLeadsTab({ leads = [], refreshLeads }) {
  const [nestedTab, setNestedTab] = useState('new-lead'); // 'new-lead' | 'saved-leads'
  const [editingLead, setEditingLead] = useState(null);
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('All');

  const ONLINE_SOURCES = ['popup', 'course-page', 'website', 'facebook', 'instagram (organic)', 'google search'];

  const isOfflineLead = (l) => {
    if (!l) return false;
    const src = (l.source || '').toLowerCase();
    if (['walk-in', 'phone call', 'whatsapp', 'youtube', 'instagram', 'google', 'friend / referral', 'other', 'website', 'popup', 'course-page'].includes(src)) return true;
    if (l.counsellor && l.counsellor !== 'undefined') return true;
    return !ONLINE_SOURCES.includes(src);
  };

  let offlineLeads = Array.isArray(leads) ? leads.filter(isOfflineLead) : [];
  
  if (selectedSourceFilter !== 'All') {
    offlineLeads = offlineLeads.filter(l => {
      const src = (l.source || 'Other').toLowerCase();
      if (selectedSourceFilter.toLowerCase() === 'website') {
        return src === 'website' || src === 'popup' || src === 'course-page';
      }
      return src === selectedSourceFilter.toLowerCase();
    });
  }

  const getCounsellor = (l) => {
    if (l.counsellor && l.counsellor !== 'undefined' && l.counsellor !== 'Unassigned') {
      return l.counsellor;
    }
    if (l.message && l.message.includes('Counsellor:')) {
      return l.message.replace('Counsellor:', '').trim();
    }
    return 'Khushi Soni';
  };

  const handleLeadSubmit = async (leadData) => {
    if (!leadData) return; // cancelled
    try {
      const assignedCounsellor = leadData.counsellor || 'Khushi Soni';
      const payload = {
        name: leadData.name,
        phone: leadData.contact,
        source: leadData.source,
        course: leadData.course,
        status: editingLead?.status || 'pending',
        counsellor: assignedCounsellor,
        message: `Counsellor: ${assignedCounsellor}`,
        date: leadData.date,
        leadType: leadData.leadType || 'Cold'
      };

      if (editingLead) {
        await leadService.updateLead(editingLead._id || editingLead.id, payload);
      } else {
        await leadService.createOfflineLead(payload);
      }

      if (typeof refreshLeads === 'function') {
        refreshLeads();
      }

      setEditingLead(null);
      setNestedTab('saved-leads');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save offline lead.');
    }
  };

  const handleEditLead = (lead) => {
    setEditingLead({
      ...lead,
      id: lead._id || lead.id,
      contact: lead.phone,
      source: lead.source,
      counsellor: getCounsellor(lead),
      leadType: lead.leadType || 'Cold',
      // Normalize date to YYYY-MM-DD
      date: lead.date ? new Date(lead.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
    });
    setNestedTab('new-lead');
  };

  const handleDeleteLead = async (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await leadService.deleteLead(id);
        if (typeof refreshLeads === 'function') {
          refreshLeads();
        }
      } catch (err) {
        console.error(err);
        alert('Failed to delete lead.');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingLead(null);
    setNestedTab('saved-leads');
  };

  return (
    <div className="space-y-6">
      {/* Nested Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="bg-white border border-[#E8E6E1] rounded-2xl p-2 flex items-center shadow-sm w-fit gap-2">
          <button
            onClick={() => {
              setNestedTab('new-lead');
              setEditingLead(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              nestedTab === 'new-lead'
                ? 'bg-rose-50 text-[#E31C1C]'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <Plus size={14} />
            {editingLead ? 'Edit Lead' : 'New Offline Lead'}
          </button>
          <button
            onClick={() => {
              setNestedTab('saved-leads');
              setEditingLead(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              nestedTab === 'saved-leads'
                ? 'bg-slate-100 text-slate-800'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <List size={14} />
            Saved Leads ({offlineLeads.length})
          </button>
        </div>

        {nestedTab === 'saved-leads' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            <Filter size={14} className="text-slate-400 shrink-0 mr-1" />
            {LEAD_SOURCES.map(src => (
              <button
                key={src}
                onClick={() => setSelectedSourceFilter(src)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-colors border ${
                  selectedSourceFilter === src 
                    ? 'bg-[#E31C1C] text-white border-[#E31C1C]' 
                    : 'bg-white text-slate-500 border-[#E8E6E1] hover:bg-slate-50'
                }`}
              >
                {src}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      {nestedTab === 'new-lead' ? (
        <OfflineLeadForm
          onSubmit={handleLeadSubmit}
          editingLead={editingLead}
          onCancel={editingLead ? handleCancelEdit : null}
        />
      ) : (
        /* Saved Leads Table */
        <div className="bg-white border border-[#E8E6E1] rounded-2xl shadow-sm overflow-hidden">
          {offlineLeads.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-xs font-bold text-slate-400">No offline leads recorded yet for this filter.</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-8 gap-2 px-5 py-3 bg-[#FAF9F6] border-b border-[#E8E6E1] text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <span className="col-span-2">Name</span>
                <span>Contact</span>
                <span>Source</span>
                <span>Course</span>
                <span>Type</span>
                <span>Date</span>
                <span className="text-right">Actions</span>
              </div>

              {/* Table Rows */}
              {offlineLeads.map(lead => (
                <div
                  key={lead._id || lead.id}
                  className="grid grid-cols-8 gap-2 px-5 py-3.5 border-b border-[#F0EEEA] last:border-b-0 hover:bg-[#FAFAF9] transition-colors items-center"
                >
                  <span className="col-span-2 text-xs font-bold text-slate-800 truncate">{lead.name}</span>
                  <span className="text-xs font-semibold text-slate-600">{lead.phone}</span>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{lead.source}</span>
                  <span className="text-xs font-semibold text-slate-700 truncate">{lead.course}</span>
                  
                  {/* Lead Type Badge */}
                  <span className="flex items-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${LEAD_TYPE_COLORS[lead.leadType || 'Cold'] || LEAD_TYPE_COLORS['Cold']}`}>
                      {lead.leadType || 'Cold'}
                    </span>
                  </span>

                  <span className="text-[10px] font-bold text-slate-500">
                    {formatDate(lead.date || lead.createdAt)}
                  </span>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEditLead(lead)}
                      className="text-[10px] font-black text-[#E31C1C] hover:underline cursor-pointer bg-transparent border-0 outline-none"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteLead(lead._id || lead.id)}
                      className="text-[10px] font-black text-slate-400 hover:text-red-600 cursor-pointer bg-transparent border-0 outline-none"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
