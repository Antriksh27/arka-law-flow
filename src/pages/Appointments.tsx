
import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
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
    <DashboardLayout>
      {viewType === 'calendar' ? (
        <div className="fixed inset-0 top-[120px] bg-gray-50 p-4">
          <div className="h-full flex flex-col gap-4">
            <div className="flex-shrink-0">
              <AppointmentsHeader onViewChange={setViewType} currentView={viewType} />
              <AppointmentsFilters filters={filters} onFilterChange={setFilters} />
            </div>
            <div className="flex-1 min-h-0">
              <AppointmentsCalendar filters={filters} />
            </div>
          </div>
        </div>
      ) : (
        <div className="container max-w-none flex h-full w-full flex-col items-start gap-6 bg-gray-50 py-12">
          <AppointmentsHeader onViewChange={setViewType} currentView={viewType} />
          <AppointmentsFilters filters={filters} onFilterChange={setFilters} />
          
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm w-full">
            <AppointmentsTable filters={filters} />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Appointments;
