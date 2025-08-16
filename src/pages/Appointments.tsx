
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppointmentsHeader } from '../components/appointments/AppointmentsHeader';
import { AppointmentsFilters } from '../components/appointments/AppointmentsFilters';
import { AppointmentsTable } from '../components/appointments/AppointmentsTable';
import { AppointmentsCalendar } from '../components/appointments/AppointmentsCalendar';
import { AppointmentsTimeline } from '../components/appointments/AppointmentsTimeline';
import { AppointmentsSidebar } from '../components/appointments/AppointmentsSidebar';
import DefaultPageLayout from '../components/messages/ui/DefaultPageLayout';
import { Button } from '../components/ui/button';
import { TextField } from '../components/messages/ui/TextField';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group';
import { Filter, Plus, Search, LayoutList, Calendar, Clock, Copy } from 'lucide-react';
import { useDialog } from '@/hooks/use-dialog';
import { CreateAppointmentDialog } from '../components/appointments/CreateAppointmentDialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { getPublicBaseUrl } from '@/lib/appConfig';
import { ALLOWED_BOOKING_ROLES } from '@/lib/bookingConfig';

export type ViewType = 'timeline' | 'calendar';

export interface FilterState {
  dateRange: { from?: Date; to?: Date };
  status: string[];
  assignedUser: string;
  client: string;
  case: string;
  searchQuery: string;
  showPastAppointments: boolean;
}

const Appointments = () => {
  const [viewType, setViewType] = useState<ViewType>('timeline');
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { from: undefined, to: undefined },
    status: [],
    assignedUser: '',
    client: '',
    case: '',
    searchQuery: '',
    showPastAppointments: false,
  });
  const { openDialog } = useDialog();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      searchQuery: event.target.value
    });
  };

  return (
    <DefaultPageLayout>
      <div className="container max-w-none flex h-full w-full flex-col items-start gap-6 bg-white py-12 overflow-auto">
        <div className="flex w-full items-center justify-between">
          <span className="text-2xl font-semibold text-gray-900">
            My Appointments
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/availability')}>
              <Clock className="w-4 h-4 mr-2" />
              My Availability
            </Button>
            {user?.id && role && ALLOWED_BOOKING_ROLES.includes(role) && (
              <Button
                variant="outline"
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
                <Copy className="w-4 h-4 mr-2" />
                Public Link
              </Button>
            )}
            <Button variant="outline" onClick={() => console.log('Filter clicked')}>
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button onClick={() => openDialog(<CreateAppointmentDialog />)}>
              <Plus className="w-4 h-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>
        <div className="flex h-px w-full flex-none flex-col items-center gap-2 bg-gray-200" />
        <div className="flex w-full items-start gap-6">
          <AppointmentsSidebar />
          <div className="flex flex-col items-start gap-4 grow">
            <div className="flex w-full items-center gap-4">
              <TextField
                className="grow"
                variant="filled"
                label=""
                helpText=""
                icon={<Search className="w-4 h-4" />}
              >
                <TextField.Input
                  placeholder="Search appointments..."
                  value={filters.searchQuery}
                  onChange={handleSearchChange}
                />
              </TextField>
              <ToggleGroup type="single" value={viewType} onValueChange={(value: string) => value && setViewType(value as ViewType)}>
                <ToggleGroupItem value="timeline">
                  <LayoutList className="w-4 h-4 mr-2" />
                  Timeline
                </ToggleGroupItem>
                <ToggleGroupItem value="calendar">
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendar
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="w-full">
              {viewType === 'calendar' ? (
                <AppointmentsCalendar filters={filters} />
              ) : (
                <AppointmentsTimeline filters={filters} />
              )}
            </div>
          </div>
        </div>
        <AppointmentsFilters filters={filters} onFilterChange={setFilters} />
      </div>
    </DefaultPageLayout>
  );
};

export default Appointments;
