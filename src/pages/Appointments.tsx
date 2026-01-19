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
import { Filter, Plus, Search, LayoutList, Calendar, Clock, Copy, SlidersHorizontal } from 'lucide-react';
import { useDialog } from '@/hooks/use-dialog';
import { CreateAppointmentDialog } from '../components/appointments/CreateAppointmentDialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { getPublicBaseUrl } from '@/lib/appConfig';
import { ALLOWED_BOOKING_ROLES } from '@/lib/bookingConfig';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileStickyHeader } from '@/components/mobile/MobileStickyHeader';

import { MobileFAB } from '@/components/mobile/MobileFAB';
import { MobileAppointmentCard } from '../components/appointments/MobileAppointmentCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import TimeUtils from '@/lib/timeUtils';
import { ViewAppointmentDialog } from '../components/appointments/ViewAppointmentDialog';
import { Loader2, AlertCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';

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
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const { openDialog } = useDialog();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const isMobile = useIsMobile();

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      searchQuery: event.target.value
    });
  };

  // Mobile data fetching
  const { data: mobileAppointments, isLoading: isMobileLoading } = useQuery({
    queryKey: ['appointments-mobile', user?.id, filters.searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('appointment_details')
        .select('*')
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: true });
      
      if (user?.id) {
        query = query.eq('lawyer_id', user.id);
      }
      
      const today = TimeUtils.formatDateInput(TimeUtils.nowDate());
      query = query.gte('appointment_date', today);
      
      if (filters.searchQuery) {
        query = query.or(`client_name.ilike.%${filters.searchQuery}%,case_title.ilike.%${filters.searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: isMobile,
  });

  const groupedAppointments = React.useMemo(() => {
    if (!mobileAppointments) return {};
    
    const groups: Record<string, any[]> = {};
    mobileAppointments.forEach((apt) => {
      if (!groups[apt.appointment_date]) {
        groups[apt.appointment_date] = [];
      }
      groups[apt.appointment_date].push(apt);
    });
    
    return groups;
  }, [mobileAppointments]);

  const handleAppointmentClick = (appointment: any) => {
    openDialog(
      <ViewAppointmentDialog 
        appointment={{
          id: appointment.id,
          title: appointment.title,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          status: appointment.status,
          type: appointment.type || null,
          lawyer_id: appointment.lawyer_id || null,
          lawyer_name: appointment.assigned_user_name,
          location: appointment.location,
          notes: appointment.notes || null,
          client_name: appointment.client_name,
          client_id: appointment.client_id || null,
          case_id: appointment.case_id || null,
          duration_minutes: appointment.duration_minutes
        }}
      />
    );
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileStickyHeader
          title="Appointments"
          searchValue={filters.searchQuery}
          onSearchChange={(value) => setFilters({ ...filters, searchQuery: value })}
          searchPlaceholder="Search appointments..."
          onFilterClick={() => setShowMobileFilters(true)}
        />

        <div className="p-4 space-y-4">

          {isMobileLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !mobileAppointments || mobileAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Calendar className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-sm">No appointments found</p>
            </div>
          ) : (
            Object.entries(groupedAppointments).map(([date, appointments]) => (
              <div key={date} className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground px-1">
                  {TimeUtils.formatDate(TimeUtils.toISTDate(date)!, 'EEEE, MMMM d')}
                </h3>
                {appointments.map((appointment) => (
                  <MobileAppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onClick={() => handleAppointmentClick(appointment)}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        <MobileFAB
          onClick={() => openDialog(<CreateAppointmentDialog />)}
          icon={Plus}
        />

        <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Filter Appointments</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              <AppointmentsFilters filters={filters} onFilterChange={setFilters} />
            </div>
          </SheetContent>
        </Sheet>

        
      </div>
    );
  }

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
