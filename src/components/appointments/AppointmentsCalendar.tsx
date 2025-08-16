
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FilterState } from '../../pages/Appointments';
import { FullScreenCalendar } from '@/components/ui/fullscreen-calendar';
import { useDialog } from '@/hooks/use-dialog';
import { CreateAppointmentDialog } from './CreateAppointmentDialog';
import { DayAppointmentsDialog } from './DayAppointmentsDialog';
import { ViewAppointmentDialog } from './ViewAppointmentDialog';
import { useAuth } from '@/contexts/AuthContext';

import {
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { 
  format, 
  parseISO, 
  startOfDay, 
  startOfMonth, 
  endOfMonth,
  add,
  startOfToday,
} from 'date-fns';

interface AppointmentsCalendarProps {
  filters: FilterState;
}

// Define a type for Supabase appointment data
interface SupabaseAppointment {
  id: string;
  title: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  status: string | null;
  type: string | null;
  lawyer_id: string | null;
  lawyer_name: string | null;
  location: string | null;
  notes: string | null;
}

// Define types for FullScreenCalendar data transformation
interface CalendarEvent {
  id: string;
  name: string;
  time: string;
  datetime: string;
}

interface CalendarDayData {
  day: Date;
  events: CalendarEvent[];
}

export const AppointmentsCalendar: React.FC<AppointmentsCalendarProps> = ({
  filters,
}) => {
  const { openDialog } = useDialog();
  const { user } = useAuth();
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState<Date>(startOfToday());

  const firstDayOfSelectedMonth = startOfMonth(currentDisplayMonth);
  const lastDayOfSelectedMonth = endOfMonth(currentDisplayMonth);

  const { data: rawAppointments, isLoading, error } = useQuery<SupabaseAppointment[], Error>({
    queryKey: ['appointments', format(currentDisplayMonth, 'yyyy-MM'), user?.id, filters.showPastAppointments],
    queryFn: async () => {
      // Query appointments with separate date and time fields
      let query = supabase
        .from('appointments')
        .select(`
          id,
          title,
          appointment_date,
          appointment_time,
          status,
          type,
          lawyer_id,
          location,
          notes
        `) 
        .gte('appointment_date', format(firstDayOfSelectedMonth, 'yyyy-MM-dd'))
        .lte('appointment_date', format(lastDayOfSelectedMonth, 'yyyy-MM-dd'))
        .order('appointment_date', { ascending: true });

      // Filter by current lawyer only
      if (user?.id) {
        query = query.eq('lawyer_id', user.id);
      }

      const { data: appointmentsData, error: appointmentsError } = await query;

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
        throw appointmentsError;
      }

      if (!appointmentsData || appointmentsData.length === 0) {
        return [];
      }

      // Get unique lawyer IDs
      const lawyerIds = [...new Set(appointmentsData
        .map(app => app.lawyer_id)
        .filter(id => id !== null))] as string[];

      // Fetch lawyer names separately if there are any lawyer IDs
      let lawyerNames: Record<string, string> = {};
      if (lawyerIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', lawyerIds);

        if (profilesError) {
          console.error('Error fetching lawyer profiles:', profilesError);
          // Don't throw here, just continue without names
        } else if (profilesData) {
          lawyerNames = Object.fromEntries(
            profilesData.map(profile => [profile.id, profile.full_name || 'Unknown'])
          );
        }
      }

      // Combine appointments with lawyer names
      const enrichedAppointments: SupabaseAppointment[] = appointmentsData.map(appointment => ({
        ...appointment,
        lawyer_name: appointment.lawyer_id ? lawyerNames[appointment.lawyer_id] || 'Unknown' : null
      }));

      return enrichedAppointments;
    },
  });

  // Store appointments by ID for easy lookup
  const appointmentsById = useMemo(() => {
    if (!rawAppointments) return {};
    return Object.fromEntries(
      rawAppointments.map(appointment => [appointment.id, appointment])
    );
  }, [rawAppointments]);

  const calendarDataForFullScreen = useMemo((): CalendarDayData[] => {
    if (!rawAppointments) return [];

    const eventsByDay: Record<string, CalendarEvent[]> = {};

    rawAppointments.forEach((app) => {
      if (!app.appointment_date || !app.id) return;

      const appointmentDate = parseISO(app.appointment_date);
      const dayKey = format(appointmentDate, "yyyy-MM-dd");

      if (!eventsByDay[dayKey]) {
        eventsByDay[dayKey] = [];
      }
      
      const assigneeName = app.lawyer_name || 'N/A';
      const timeDisplay = app.appointment_time ? format(parseISO(`2000-01-01T${app.appointment_time}`), 'p') : 'No time';
      
      // Construct datetime for the event
      const datetime = app.appointment_time 
        ? `${app.appointment_date}T${app.appointment_time}` 
        : `${app.appointment_date}T00:00:00`;

      eventsByDay[dayKey].push({
        id: app.id,
        name: `${app.title || 'No Title'} (${assigneeName})`,
        time: timeDisplay,
        datetime: datetime,
      });
    });

    return Object.entries(eventsByDay).map(([dayKey, events]) => ({
      day: parseISO(dayKey),
      events,
    }));
  }, [rawAppointments]);

  const handleMonthChange = (newMonthFirstDay: Date) => {
    setCurrentDisplayMonth(newMonthFirstDay);
  };

  const handleNewEvent = () => {
    openDialog(<CreateAppointmentDialog />);
  };
  
  const handleDateSelect = (date: Date) => {
    console.log("Date selected:", date);
    
    // Get appointments for the selected date
    const selectedDateString = format(date, 'yyyy-MM-dd');
    const appointmentsForDate = rawAppointments?.filter(app => 
      app.appointment_date === selectedDateString
    ) || [];
    
    // Open the day appointments dialog
    openDialog(
      <DayAppointmentsDialog 
        selectedDate={date}
        appointments={appointmentsForDate}
        onClose={() => {
          // This will be handled by the dialog hook automatically
        }}
      />
    );
  };

  const handleEventClick = (eventId: string) => {
    const appointment = appointmentsById[eventId];
    if (appointment) {
      openDialog(<ViewAppointmentDialog appointment={appointment} />);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 bg-white border border-borderGray rounded-2xl shadow-sm min-h-[calc(100vh-300px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primaryBlue" />
        <span className="ml-4 text-lg text-textBase">Loading appointments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-red-50 border border-red-200 rounded-2xl shadow-sm min-h-[calc(100vh-300px)]">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <span className="mt-4 text-lg text-red-700">Error loading appointments.</span>
        <p className="text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <FullScreenCalendar
      data={calendarDataForFullScreen}
      initialMonth={format(currentDisplayMonth, "MMM-yyyy")}
      onMonthChange={handleMonthChange}
      onNewEventClick={handleNewEvent}
      onDateSelect={handleDateSelect}
      onEventClick={handleEventClick}
    />
  );
};
