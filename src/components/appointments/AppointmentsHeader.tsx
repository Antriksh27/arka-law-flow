
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Plus, Calendar, List, ArrowRight, Copy } from 'lucide-react';
import { useDialog } from '@/hooks/use-dialog';
import { CreateAppointmentDialog } from './CreateAppointmentDialog';
import { ViewType } from '../../pages/Appointments';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { getPublicBaseUrl } from '@/lib/appConfig';
import { ALLOWED_BOOKING_ROLES } from '@/lib/bookingConfig';
import { SyncAppointmentsButton } from './SyncAppointmentsButton';
interface AppointmentsHeaderProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export const AppointmentsHeader: React.FC<AppointmentsHeaderProps> = ({
  currentView,
  onViewChange
}) => {
  const { openDialog } = useDialog();
  const { user, role } = useAuth();

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
        <div className="flex items-center gap-2">
          <SyncAppointmentsButton />
          {user && user.id && role && ALLOWED_BOOKING_ROLES.includes(role) && (
            <>
              <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <Link to={`/book/${user.id}`} target="_blank" rel="noopener noreferrer">
                  My Booking Page
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const url = `${getPublicBaseUrl()}/book/${user.id}`;
                  navigator.clipboard.writeText(url);
                  toast({
                    title: 'Public link copied',
                    description: 'Share this booking link with clients.',
                  });
                }}
                aria-label="Copy public booking link"
              >
                <Copy className="w-4 h-4" />
                Public Link
              </Button>
            </>
          )}
          <Button 
            onClick={() => openDialog(<CreateAppointmentDialog />)} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-4 h-4" />
            New Appointment
          </Button>
        </div>
      </div>
      <div className="flex w-full flex-wrap items-center gap-4 justify-end">
        <div className="bg-gray-100 rounded-lg flex p-1">
          <button 
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 ${
              currentView === 'timeline' 
                ? 'bg-white shadow-sm text-gray-800' 
                : 'text-gray-600 hover:text-gray-900'
            }`} 
            onClick={() => onViewChange('timeline')}
          >
            <List className="h-4 w-4" />
            <span className="text-sm font-medium">Timeline</span>
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

