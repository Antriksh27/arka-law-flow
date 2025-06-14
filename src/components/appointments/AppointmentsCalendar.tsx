
import React from 'react';
import { FilterState } from '../../pages/Appointments';

interface AppointmentsCalendarProps {
  filters: FilterState;
}

export const AppointmentsCalendar: React.FC<AppointmentsCalendarProps> = ({ filters }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm w-full p-6">
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">Calendar View</div>
        <div className="text-gray-400">Calendar functionality coming soon...</div>
        <div className="text-sm text-gray-400 mt-2">
          This will show appointments in a weekly/monthly calendar format
        </div>
      </div>
    </div>
  );
};
