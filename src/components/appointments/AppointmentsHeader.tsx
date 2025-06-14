
import React from 'react';
import { Button } from '../ui/button';
import { Plus, Calendar, List } from 'lucide-react';
import { useDialog } from '@/hooks/use-dialog';
import { CreateAppointmentDialog } from './CreateAppointmentDialog';
import { ViewType } from '../../pages/Appointments';

interface AppointmentsHeaderProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export const AppointmentsHeader: React.FC<AppointmentsHeaderProps> = ({
  currentView,
  onViewChange
}) => {
  const { openDialog } = useDialog();

  return (
    <div className="flex w-full flex-col items-start gap-4">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-2xl font-semibold text-gray-900">
            Appointments
          </span>
          <span className="text-base text-gray-600">
            Schedule and manage client appointments
          </span>
        </div>
        <Button 
          onClick={() => openDialog(<CreateAppointmentDialog />)} 
          className="bg-gray-800 hover:bg-gray-700 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Appointment
        </Button>
      </div>
      <div className="flex w-full flex-wrap items-center gap-4 justify-end">
        <div className="bg-gray-100 rounded-lg flex p-1">
          <button 
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 ${
              currentView === 'list' 
                ? 'bg-white shadow-sm text-gray-800' 
                : 'text-gray-600 hover:text-gray-900'
            }`} 
            onClick={() => onViewChange('list')}
          >
            <List className="h-4 w-4" />
            <span className="text-sm font-medium">List</span>
          </button>
          <button 
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 ${
              currentView === 'calendar' 
                ? 'bg-white shadow-sm text-gray-800' 
                : 'text-gray-600 hover:text-gray-900'
            }`} 
            onClick={() => onViewChange('calendar')}
          >
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Calendar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
