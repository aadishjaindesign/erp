import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

const FeesTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "No data records found.",
  searchPlaceholder = "Search records...",
  onSearchChange,
  searchQuery = "",
  filters = null,
  itemsPerPage = 5,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Search logic (local fallback if parent handler not supplied)
  const displayData = data.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return Object.values(item).some(
      (val) => val && String(val).toLowerCase().includes(query)
    );
  });

  const totalItems = displayData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Reset page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, data.length]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = displayData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Search & Custom Filters Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF9F6]/50 p-4 border border-[#EBEAE6] rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange ? onSearchChange(e.target.value) : null}
            className="w-full pl-10 pr-4 py-2 border border-[#DEDCD8] bg-white rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-300 transition-all"
          />
        </div>
        {filters && <div className="flex flex-wrap gap-2">{filters}</div>}
      </div>

      {/* Main Table Wrapper */}
      <div className="w-full overflow-x-auto bg-white border border-[#EBEAE6] rounded-2xl shadow-sm">
        <div className="w-full overflow-x-auto"><table className="w-full text-left border-collapse text-xs font-semibold text-slate-650">
          <thead>
            <tr className="border-b border-[#EBEAE6] bg-[#FAF9F6] text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th key={idx} className={`px-6 py-4 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#FAF9F6]">
            {loading ? (
              // Loading skeletons
              Array.from({ length: itemsPerPage }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-6 py-4.5">
                      <div className="h-3 bg-slate-100 rounded w-2/3" />
                    </td>
                  ))}
                </tr>
              ))
            ) : currentItems.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-slate-50 border border-slate-200 text-slate-400 rounded-full flex items-center justify-center shadow-xs">
                      <Inbox size={20} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 text-sm">No Records Found</h4>
                      <p className="text-[11px] text-slate-400 leading-normal">{emptyMessage}</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              // Row Rendering
              currentItems.map((row, rIdx) => (
                <tr key={row.id || rIdx} className="hover:bg-[#FAF9F6]/40 transition-colors">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`px-6 py-3.5 ${col.className || ''}`}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table></div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-white border border-[#EBEAE6] rounded-2xl text-xs text-slate-500 font-bold">
          <div>
            Showing <span className="text-slate-800">{startIndex + 1}</span> to{' '}
            <span className="text-slate-800">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of{' '}
            <span className="text-slate-800">{totalItems}</span> entries
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="p-1.5 rounded-lg border border-[#DEDCD8] bg-white text-slate-650 hover:bg-[#FAF9F6] disabled:opacity-50 disabled:hover:bg-white transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pNum = idx + 1;
              return (
                <button
                  key={pNum}
                  onClick={() => setCurrentPage(pNum)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg border text-[11px] transition-all cursor-pointer ${
                    currentPage === pNum
                      ? 'bg-amber-500 border-amber-500 text-white font-extrabold shadow-sm'
                      : 'border-[#DEDCD8] bg-white text-slate-650 hover:bg-[#FAF9F6]'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className="p-1.5 rounded-lg border border-[#DEDCD8] bg-white text-slate-650 hover:bg-[#FAF9F6] disabled:opacity-50 disabled:hover:bg-white transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeesTable;
