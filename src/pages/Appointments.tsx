
import React, { useState } from 'react';
import { AppointmentsHeader } from '../components/appointments/AppointmentsHeader';
import { AppointmentsFilters } from '../components/appointments/AppointmentsFilters';
import { AppointmentsTable } from '../components/appointments/AppointmentsTable';
import { AppointmentsCalendar } from '../components/appointments/AppointmentsCalendar';

export type ViewType = 'list' | 'calendar';

export interface FilterState {
  dateRange: { from?: Date; to?: Date };
  status: string[];
  assignedUser: string;
  client: string;
  case: string;
  searchQuery: string;
}

const Appointments = () => {
  const [viewType, setViewType] = useState<ViewType>('list');
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { from: undefined, to: undefined },
    status: [],
    assignedUser: '',
    client: '',
    case: '',
    searchQuery: '',
  });

  return (
    <div className="space-y-6">
      <AppointmentsHeader onViewChange={setViewType} currentView={viewType} />
      <AppointmentsFilters filters={filters} onFilterChange={setFilters} />
      
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm w-full">
        {viewType === 'calendar' ? (
          <AppointmentsCalendar filters={filters} />
        ) : (
          <AppointmentsTable filters={filters} />
        )}
      </div>
    </div>
  );
};

export default Appointments;
