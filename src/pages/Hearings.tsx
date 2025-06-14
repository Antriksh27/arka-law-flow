
import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { HearingsHeader } from '../components/hearings/HearingsHeader';
import { HearingsFilters } from '../components/hearings/HearingsFilters';
import { HearingsTimeline } from '../components/hearings/HearingsTimeline';
import { HearingsTable } from '../components/hearings/HearingsTable';
import { FilterState, ViewType } from '../components/hearings/types';

const Hearings = () => {
  const [viewType, setViewType] = useState<ViewType>('timeline');
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { from: undefined, to: undefined },
    status: [],
    case: '',
    court: '',
    assignedUser: '',
    searchQuery: '',
  });

  return (
    <DashboardLayout>
      <div className="container max-w-none flex h-full w-full flex-col items-start gap-6 bg-gray-50 py-12">
        <HearingsHeader onViewChange={setViewType} currentView={viewType} />
        <HearingsFilters filters={filters} onFilterChange={setFilters} />
        
        {viewType === 'timeline' ? (
          <HearingsTimeline filters={filters} />
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm w-full">
            <HearingsTable filters={filters} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Hearings;
