const fs = require('fs');
const path = './client/src/Modules/Attendance/pages/Attendance.jsx';
let content = fs.readFileSync(path, 'utf8');

const calendarLogicAndModal = `
  // --- EMPLOYEE CALENDAR MODAL LOGIC ---
  useEffect(() => {
    if ((showReportModal || showEmployeeCalendarModal) && reportEmployeeId && selectedReportMonthKey) {
      fetchMonthlyReport();
    }
  }, [showReportModal, showEmployeeCalendarModal, reportEmployeeId, selectedReportMonthKey]);

  let activeMonth = new Date().getMonth();
  let activeYear = new Date().getFullYear();
  if (selectedReportMonthKey) {
    const parts = selectedReportMonthKey.split('-');
    activeYear = parseInt(parts[0]);
    activeMonth = parseInt(parts[1]) - 1;
  }

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const totalDays = getDaysInMonth(activeYear, activeMonth);
  const firstDayIndex = getFirstDayOfMonth(activeYear, activeMonth);

  const gridCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    gridCells.push({ day: null, type: 'empty' });
  }

  const logsMap = {};
  reportData.forEach(dayInfo => {
    const d = new Date(dayInfo.date);
    const key = \`\${d.getFullYear()}-\${d.getMonth()}-\${d.getDate()}\`;
    logsMap[key] = dayInfo;
  });

  const now = new Date();
  const todayDateKey = \`\${now.getFullYear()}-\${now.getMonth()}-\${now.getDate()}\`;

  let calPresentsCount = 0;
  let calLatesCount = 0;
  let calAbsentsCount = 0;

  for (let day = 1; day <= totalDays; day++) {
    const key = \`\${activeYear}-\${activeMonth}-\${day}\`;
    const log = logsMap[key];
    const cellDate = new Date(activeYear, activeMonth, day);
    const isWeekend = cellDate.getDay() === 0;
    const isFuture = cellDate > now;
    const isToday = key === todayDateKey;

    let status = 'None';
    if (log && log.status && log.status !== '-') {
      status = log.status;
    } else if (isFuture) {
      status = 'Future';
    } else if (isWeekend) {
      status = 'Weekend';
    } else {
      status = 'Absent'; // Default past unfilled to Absent
    }

    if (status === 'Present') calPresentsCount++;
    if (status === 'Late') calLatesCount++;
    if (status === 'Absent') calAbsentsCount++;

    gridCells.push({ day, type: 'day', cellDate, status, isToday, log });
  }

  useEffect(() => {
    if (showEmployeeCalendarModal) {
      let defaultCell = gridCells.find(c => c.isToday);
      if (!defaultCell) {
        defaultCell = [...gridCells].reverse().find(c => c.type === 'day' && c.status !== 'Future');
      }
      if (defaultCell && !selectedDayDetails) {
        setSelectedDayDetails({
          day: defaultCell.day,
          dateLabel: \`\${defaultCell.cellDate.toLocaleDateString('en-GB', { weekday: 'short' })}, \${formatDate(defaultCell.cellDate)}\`,
          status: defaultCell.status,
          log: defaultCell.log
        });
      }
    } else {
      setSelectedDayDetails(null);
    }
  }, [showEmployeeCalendarModal, selectedReportMonthKey, reportData]);

  const handleDayCellClick = (cell) => {
    if (cell.type !== 'day') return;
    setIsEditingAttendance(false);
    setSelectedDayDetails({
      day: cell.day,
      dateLabel: \`\${cell.cellDate.toLocaleDateString('en-GB', { weekday: 'short' })}, \${formatDate(cell.cellDate)}\`,
      status: cell.status,
      log: cell.log
    });
  };

  // Prevent modal background scroll & ESC handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowTimingModal(false);
        setShowAddModal(false);
        setShowEditModal(false);
        setShowEditLeaveModal(false);
        setShowHolidayModal(false);
        setShowReportModal(false);
        setShowEmployeeTimingModal(false);
        setShowEmployeeCalendarModal(false);
      }
    };

    if (showTimingModal || showAddModal || showEditModal || showEditLeaveModal || showHolidayModal || showReportModal || showEmployeeTimingModal || showEmployeeCalendarModal) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showTimingModal, showAddModal, showEditModal, showEditLeaveModal, showHolidayModal, showReportModal, showEmployeeTimingModal, showEmployeeCalendarModal]);
`;

const modalRender = `
      {/* EMPLOYEE CALENDAR MODAL */}
      {showEmployeeCalendarModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowEmployeeCalendarModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                {reportEmployeeInfo?.profilePicture ? (
                  <img src={reportEmployeeInfo.profilePicture} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shadow-sm border-2 border-white">
                    <User size={18} />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                    {reportEmployeeInfo?.name} {reportEmployeeInfo?.lastName}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{reportEmployeeInfo?.designation || 'Employee'}</p>
                </div>
              </div>
              <button onClick={() => setShowEmployeeCalendarModal(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-red-100">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              {reportLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-800 tracking-tight">Attendance Calendar</h4>
                    </div>
                    <select
                      value={selectedReportMonthKey}
                      onChange={(e) => setSelectedReportMonthKey(e.target.value)}
                      className="bg-[#FAF9F6] border border-[#DEDCD8] rounded-xl text-xs font-black text-slate-800 p-2 outline-none cursor-pointer focus:border-slate-400"
                    >
                      {reportMonthsList.map(opt => (
                        <option key={opt.key} value={opt.key}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Calendar Grid */}
                  <div className="bg-white border border-[#EBEAE6] p-3.5 rounded-3xl shadow-xs">
                    <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider pb-2 mb-2 border-b border-slate-100">
                      <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-center">
                      {gridCells.map((cell, idx) => {
                        if (cell.type === 'empty') return <div key={\`empty-\${idx}\`} />;
                        let colorClass = 'bg-white border border-slate-100 hover:border-slate-300 text-slate-600';
                        if (cell.status === 'Present') colorClass = 'bg-green-500 text-white font-black shadow-xs border-0';
                        else if (cell.status === 'Late') colorClass = 'bg-amber-400 text-white font-black shadow-xs border-0';
                        else if (cell.status === 'Absent') colorClass = 'bg-red-500 text-white font-black shadow-xs border-0';
                        else if (cell.status === 'Weekend') colorClass = 'bg-slate-50 text-slate-400 border border-slate-200';
                        else if (cell.status === 'Future') colorClass = 'bg-white border border-dashed border-slate-200 text-slate-300';
                        else if (cell.status === 'Holiday') colorClass = 'bg-[#8B5CF6] text-white font-black shadow-xs border-0';
                        else if (cell.status.includes('Leave')) colorClass = 'bg-[#3B82F6] text-white font-black shadow-xs border-0';
                        
                        const isSelected = selectedDayDetails?.day === cell.day;
                        const ringClass = isSelected ? 'ring-2 ring-indigo-600 ring-offset-1' : '';
                        const todayTextClass = cell.isToday ? 'font-black underline decoration-2' : 'font-extrabold';
                        
                        return (
                          <button
                            key={\`day-\${cell.day}\`}
                            onClick={() => handleDayCellClick(cell)}
                            disabled={cell.status === 'Future'}
                            className={\`w-8 h-8 rounded-full flex items-center justify-center text-xs select-none cursor-pointer transition-all active:scale-90 outline-none mx-auto \${colorClass} \${ringClass} \${todayTextClass}\`}
                          >
                            {cell.day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Day Inspector Card Details */}
                  {selectedDayDetails ? (
                    <div className="bg-[#FAF9F6] border border-[#EBEAE6] p-4 rounded-2xl space-y-3 shadow-xs">
                      {isEditingAttendance ? (
                        <div className="space-y-3">
                          <span className="text-xs text-slate-800 font-extrabold">Edit Attendance ({selectedDayDetails.dateLabel})</span>
                          {editAttendanceError && (
                            <div className="p-2 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100">{editAttendanceError}</div>
                          )}
                          <div className="grid grid-cols-1 gap-2.5">
                            <div>
                              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mb-1">Status</span>
                              <select value={editAttendanceForm.status} onChange={(e) => setEditAttendanceForm({ ...editAttendanceForm, status: e.target.value })} className="w-full bg-white border border-[#DEDCD8] rounded-xl text-xs font-bold text-slate-800 p-2 outline-none">
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                                <option value="Half Day">Half Day</option>
                                <option value="Leave">Leave</option>
                                <option value="Holiday">Holiday</option>
                                <option value="Late">Late</option>
                                <option value="On-time">On-time</option>
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                              <div>
                                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mb-1">Check In</span>
                                <input type="time" value={editAttendanceForm.checkIn} onChange={(e) => setEditAttendanceForm({ ...editAttendanceForm, checkIn: e.target.value })} className="w-full bg-white border border-[#DEDCD8] rounded-xl text-xs font-bold text-slate-800 p-2 outline-none" />
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mb-1">Check Out</span>
                                <input type="time" value={editAttendanceForm.checkOut} onChange={(e) => setEditAttendanceForm({ ...editAttendanceForm, checkOut: e.target.value })} className="w-full bg-white border border-[#DEDCD8] rounded-xl text-xs font-bold text-slate-800 p-2 outline-none" />
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button onClick={handleCancelEditAttendance} disabled={editAttendanceLoading} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors border border-slate-200 cursor-pointer">Cancel</button>
                            <button onClick={handleSaveAttendance} disabled={editAttendanceLoading} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors shadow-sm cursor-pointer">{editAttendanceLoading ? 'Saving...' : 'Save'}</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-800 font-extrabold">{selectedDayDetails.dateLabel}</span>
                            <span className={\`text-[9px] font-black px-2 py-0.5 rounded-md uppercase text-white \${selectedDayDetails.status === 'Present' ? 'bg-green-500' : selectedDayDetails.status === 'Late' ? 'bg-amber-400' : selectedDayDetails.status === 'Absent' ? 'bg-red-500' : selectedDayDetails.status === 'Holiday' ? 'bg-[#8B5CF6]' : selectedDayDetails.status.includes('Leave') ? 'bg-[#3B82F6]' : 'bg-slate-400'}\`}>{selectedDayDetails.status}</span>
                          </div>
                          {selectedDayDetails.log && selectedDayDetails.log.checkIn && selectedDayDetails.log.checkIn !== '-' ? (
                            <div className="flex gap-6 text-xs pt-1">
                              <div><span className="text-[9px] text-slate-400 font-black uppercase block">Punch In</span><strong className="text-slate-800 text-sm font-extrabold mt-0.5 block">{formatTime(selectedDayDetails.log.checkIn)}</strong></div>
                              <div><span className="text-[9px] text-slate-400 font-black uppercase block">Punch Out</span><strong className="text-slate-800 text-sm font-extrabold mt-0.5 block">{selectedDayDetails.log.checkOut && selectedDayDetails.log.checkOut !== '-' ? formatTime(selectedDayDetails.log.checkOut) : '--:--'}</strong></div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 font-semibold py-1">{selectedDayDetails.status === 'Weekend' ? 'Weekly Off / Weekend' : selectedDayDetails.status === 'Holiday' ? 'Declared Holiday' : selectedDayDetails.status.includes('Leave') ? 'Approved Leave' : 'No attendance logged.'}</p>
                          )}
                          
                          {selectedDayDetails.status !== 'Holiday' && (
                            <div className="pt-2">
                              <button onClick={handleEditAttendanceClick} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2">
                                <Edit2 size={14} /> Edit Attendance
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
`;

if (content.includes('gridCells.push')) {
  console.log('Already injected.');
} else {
  // Remove old useEffect for body scroll to avoid duplicates
  content = content.replace(/\/\/ Prevent body scroll when any modal is open[\s\S]*?\}, \[showTimingModal, showAddModal, showEditModal, showEditLeaveModal, showHolidayModal, showReportModal, showEmployeeTimingModal\]\);/, "");

  // Find the exact line index for `  return (` that starts the JSX
  const mainReturnRegex = /^  return \($/m;
  const match = content.match(mainReturnRegex);
  if (match) {
    const idx = match.index;
    content = content.slice(0, idx) + calendarLogicAndModal + "\n" + content.slice(idx);
    
    // Inject modal before final closing
    const endIdx = content.lastIndexOf('</div>\n  );\n}');
    if (endIdx !== -1) {
       content = content.slice(0, endIdx) + "\n" + modalRender + "\n    " + content.slice(endIdx);
       fs.writeFileSync(path, content, 'utf8');
       console.log("Successfully injected calendar logic at the top level.");
    } else {
       console.log("Could not find end tag.");
    }
  } else {
    console.log("Could not find main return block.");
  }
}
