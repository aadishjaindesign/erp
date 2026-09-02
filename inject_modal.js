const fs = require('fs');
const path = './client/src/Modules/Attendance/pages/Attendance.jsx';
let content = fs.readFileSync(path, 'utf8');

const quickEditModalCode = `
      {/* QUICK EDIT ATTENDANCE MODAL */}
      {showQuickEditModal && quickEditLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowQuickEditModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 shadow-sm border-2 border-white">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                    Quick Edit
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{quickEditLog.name} {quickEditLog.lastName}</p>
                </div>
              </div>
              <button onClick={() => setShowQuickEditModal(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-red-100 outline-none">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              {quickEditError && (
                <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
                  {quickEditError}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mb-1.5">Today's Status</span>
                  <select 
                    value={quickEditForm.status} 
                    onChange={(e) => setQuickEditForm({ ...quickEditForm, status: e.target.value })} 
                    className="w-full bg-white border border-[#DEDCD8] rounded-xl text-xs font-bold text-slate-800 p-2.5 outline-none focus:border-indigo-400"
                  >
                    <option value="Present">Present (On-time)</option>
                    <option value="Late">Late</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Absent">Absent</option>
                    <option value="Leave">Leave</option>
                    <option value="Paid Leave">Paid Leave</option>
                    <option value="Unpaid Leave">Unpaid Leave</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mb-1.5">Check In</span>
                    <input 
                      type="time" 
                      value={quickEditForm.checkIn} 
                      onChange={(e) => setQuickEditForm({ ...quickEditForm, checkIn: e.target.value })} 
                      className="w-full bg-white border border-[#DEDCD8] rounded-xl text-xs font-bold text-slate-800 p-2.5 outline-none focus:border-indigo-400" 
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mb-1.5">Check Out</span>
                    <input 
                      type="time" 
                      value={quickEditForm.checkOut} 
                      onChange={(e) => setQuickEditForm({ ...quickEditForm, checkOut: e.target.value })} 
                      className="w-full bg-white border border-[#DEDCD8] rounded-xl text-xs font-bold text-slate-800 p-2.5 outline-none focus:border-indigo-400" 
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-2">
              <button 
                onClick={() => setShowQuickEditModal(false)} 
                disabled={quickEditLoading} 
                className="flex-1 py-2.5 bg-white hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors border border-[#DEDCD8] cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveQuickEdit} 
                disabled={quickEditLoading} 
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors shadow-sm cursor-pointer border-0"
              >
                {quickEditLoading ? 'Saving...' : 'Save Today'}
              </button>
            </div>
          </div>
        </div>
      )}
`;

if (content.includes('QUICK EDIT ATTENDANCE MODAL')) {
  console.log('Already injected.');
} else {
  // Inject modal before final closing
  const endIdx = content.lastIndexOf('</div>\n  );\n}');
  if (endIdx !== -1) {
     content = content.slice(0, endIdx) + "\n" + quickEditModalCode + "\n    " + content.slice(endIdx);
     fs.writeFileSync(path, content, 'utf8');
     console.log("Successfully injected quick edit modal.");
  } else {
     console.log("Could not find end tag.");
  }
}
