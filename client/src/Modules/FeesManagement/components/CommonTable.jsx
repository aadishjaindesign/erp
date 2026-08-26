import React, { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import EmptyState from './EmptyState';
import { TableSkeleton } from './Skeleton';

/**
 * CommonTable - Standardized data table for ERP lists.
 */
const CommonTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "No data records found.",
  searchPlaceholder = "Search records...",
  onSearchChange,
  searchQuery = "",
  filters = null,
  itemsPerPage = 10,
  expandable = false,
  renderExpandedRow = null,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState([]);

  const toggleRow = (rowId) => {
    setExpandedRows(prev => 
      prev.includes(rowId) ? prev.filter(id => id !== rowId) : [...prev, rowId]
    );
  };

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
  
  // Reset page when search query or dataset changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, data.length]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = displayData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Search & Custom Filters Header */}
      {(onSearchChange || filters) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF9F6]/50 p-4 border border-[#EBEAE6] rounded-2xl">
          {onSearchChange && (
            <SearchBar
              value={searchQuery}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
            />
          )}
          {filters && <div className="flex flex-wrap gap-2">{filters}</div>}
        </div>
      )}

      {/* Main Table Wrapper */}
      {loading ? (
        <TableSkeleton rows={itemsPerPage} cols={columns.length} />
      ) : currentItems.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="w-full overflow-x-auto bg-white border border-[#EBEAE6] rounded-2xl shadow-sm">
          <div className="w-full overflow-x-auto"><table className="w-full text-left border-collapse text-xs font-semibold text-slate-655">
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
              {currentItems.map((row, rIdx) => {
                const rowKey = row._id || row.id || rIdx;
                const isExpanded = expandedRows.includes(rowKey);
                return (
                  <React.Fragment key={rowKey}>
                    <tr 
                      onClick={() => expandable && toggleRow(rowKey)} 
                      className={`hover:bg-[#FAF9F6]/40 transition-colors ${expandable ? 'cursor-pointer' : ''} ${isExpanded ? 'bg-[#FAF9F6]/40' : ''}`}
                    >
                      {columns.map((col, cIdx) => (
                        <td key={cIdx} className={`px-6 py-3.5 ${col.className || ''}`}>
                          {col.render ? col.render(row, isExpanded) : row[col.accessor]}
                        </td>
                      ))}
                    </tr>
                    {expandable && isExpanded && renderExpandedRow && (
                      <tr className="bg-[#FAF9F6]/20">
                        <td colSpan={columns.length} className="p-0 border-b border-[#EBEAE6]">
                          {renderExpandedRow(row)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table></div>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          loading={loading}
        />
      )}
    </div>
  );
};

export default CommonTable;
