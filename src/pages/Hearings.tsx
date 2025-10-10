
import React, { useState } from 'react';
import { HearingsHeader } from '../components/hearings/HearingsHeader';
import { HearingsFilters } from '../components/hearings/HearingsFilters';
import { HearingsTimeline } from '../components/hearings/HearingsTimeline';
import { HearingsTable } from '../components/hearings/HearingsTable';
import { HearingsCalendarView } from '../components/hearings/HearingsCalendarView';
import { HearingsSummary } from '../components/hearings/HearingsSummary';
import { FilterState, ViewType } from '../components/hearings/types';

const Hearings = () => {
  const [viewType, setViewType] = useState<ViewType>('calendar');
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { from: undefined, to: undefined },
    status: [],
    case: '',
    court: '',
    assignedUser: '',
    searchQuery: '',
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <HearingsHeader onViewChange={setViewType} currentView={viewType} />
      <HearingsSummary />
      <HearingsFilters filters={filters} onFilterChange={setFilters} />
      
      {viewType === 'calendar' ? (
        <HearingsCalendarView filters={filters} />
      ) : viewType === 'timeline' ? (
        <HearingsTimeline filters={filters} />
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm w-full">
          <HearingsTable filters={filters} />
        </div>
      )}
    </div>
  );
};

export default Hearings;
