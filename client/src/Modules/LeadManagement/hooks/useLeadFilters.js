import { useState, useMemo } from 'react';

export const useLeadFilters = (leads, staffSummary) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState('New');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Map of lead ID to staff summary
  const latestActivitiesMap = useMemo(() => {
    const map = {};
    if (staffSummary) {
      staffSummary.forEach((item) => {
        if (item.leadId) {
          map[item.leadId] = item;
        }
      });
    }
    return map;
  }, [staffSummary]);

  // Map of staff members and their engaged lead IDs
  const staffLeadsMap = useMemo(() => {
    const map = {};
    if (staffSummary) {
      staffSummary.forEach((item) => {
        if (item.leadId && item.staffName) {
          if (!map[item.staffName]) {
            map[item.staffName] = [];
          }
          map[item.staffName].push(item.leadId);
        }
      });
    }
    return map;
  }, [staffSummary]);

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    
    return leads
      .filter((lead) => {
        // 1. Search Match
        const query = searchQuery.toLowerCase().trim();
        if (query) {
          const matchesName = lead.name?.toLowerCase().includes(query);
          const matchesPhone = lead.phone?.includes(query);
          const matchesEmail = lead.email?.toLowerCase().includes(query);
          const matchesStaff = Object.keys(staffLeadsMap).some(
            (s) =>
              s.toLowerCase().includes(query) &&
              staffLeadsMap[s]?.includes(lead._id)
          );
          if (!matchesName && !matchesPhone && !matchesEmail && !matchesStaff) return false;
        }

        // 2. Status Match
        if (activeStatusFilter) {
          const status = lead.status || 'New';
          const norm = status.toLowerCase();
          const hasActivity = latestActivitiesMap && latestActivitiesMap[lead._id || lead.id];
          
          if (activeStatusFilter === 'New') {
            const isNew = norm === 'new' || norm === 'pending';
            if (!isNew) return false;
          } else {
            if (norm !== activeStatusFilter.toLowerCase()) {
              return false;
            }
          }
        }

        // 3. Course Match
        if (selectedCourse && lead.course !== selectedCourse) {
          return false;
        }

        // 4. Source Match
        if (selectedSource && lead.source !== selectedSource) {
          return false;
        }

        // 5. Staff Assignment filter
        if (selectedAssignment) {
          const latest = latestActivitiesMap[lead._id];
          if (selectedAssignment === 'unassigned') {
            if (latest && latest.staffName) return false;
          } else if (selectedAssignment === 'assigned') {
            if (!latest || !latest.staffName) return false;
          } else {
            // Specific staff member
            if (!latest || latest.staffName !== selectedAssignment) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'alphabetical') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [leads, searchQuery, activeStatusFilter, selectedCourse, selectedSource, selectedAssignment, sortBy, staffLeadsMap, latestActivitiesMap]);

  const clearFilters = () => {
    setSearchQuery('');
    setActiveStatusFilter(null);
    setSelectedCourse('');
    setSelectedSource('');
    setSelectedAssignment('');
    setSortBy('newest');
  };

  const isFiltered = !!(searchQuery || activeStatusFilter || selectedCourse || selectedSource || selectedAssignment);

  return {
    searchQuery,
    setSearchQuery,
    activeStatusFilter,
    setActiveStatusFilter,
    selectedCourse,
    setSelectedCourse,
    selectedSource,
    setSelectedSource,
    selectedAssignment,
    setSelectedAssignment,
    sortBy,
    setSortBy,
    filteredLeads,
    clearFilters,
    isFiltered,
    latestActivitiesMap
  };
};
