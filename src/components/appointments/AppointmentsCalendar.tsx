import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FilterState } from '../../pages/Appointments'; // Kept for future use if filters apply to calendar
// import { Button } from '@/components/ui/button'; // Original Button for header controls - no longer used directly here
import { FullScreenCalendar } from '@/components/ui/fullscreen-calendar';
import { useDialog } from '@/hooks/use-dialog';
import { CreateAppointmentDialog } from './CreateAppointmentDialog';

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
  filters: FilterState; // Kept for potential future use
}

// Define a type for Supabase appointment data
interface SupabaseAppointment {
  id: string;
  title: string | null;
  start_time: string | null;
  status: string | null;
  type: string | null;
  lawyer_id: string | null;
  lawyer_profile: Array<{ full_name: string | null; }> | null; // Updated to expect an array of profiles or null
}

// Define types for FullScreenCalendar data transformation
interface CalendarEvent {
  id: string; // Using string for UUIDs
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
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState<Date>(startOfToday());

  const firstDayOfSelectedMonth = startOfMonth(currentDisplayMonth);
  const lastDayOfSelectedMonth = endOfMonth(currentDisplayMonth);

  const { data: rawAppointments, isLoading, error } = useQuery<SupabaseAppointment[], Error>({
    queryKey: ['appointments', format(currentDisplayMonth, 'yyyy-MM')],
    queryFn: async () => {
      const { data, error: dbError } = await supabase
        .from('appointments')
        .select(`
          id,
          title,
          start_time,
          status,
          type,
          lawyer_id,
          lawyer_profile:profiles ( full_name ) 
        `) 
        .gte('start_time', firstDayOfSelectedMonth.toISOString())
        .lte('start_time', lastDayOfSelectedMonth.toISOString())
        .order('start_time', { ascending: true });

      if (dbError) {
        console.error('Error fetching appointments:', dbError);
        throw dbError;
      }
      // The type assertion here is what was causing the error if SupabaseAppointment didn't match data's structure.
      // By updating SupabaseAppointment, this cast should now be valid.
      return (data as SupabaseAppointment[]) || [];
    },
  });

  const calendarDataForFullScreen = useMemo((): CalendarDayData[] => {
    if (!rawAppointments) return [];

    const eventsByDay: Record<string, CalendarEvent[]> = {};

    rawAppointments.forEach((app) => {
      if (!app.start_time || !app.id) return;

      const startTime = parseISO(app.start_time);
      const dayKey = format(startTime, "yyyy-MM-dd");

      if (!eventsByDay[dayKey]) {
        eventsByDay[dayKey] = [];
      }
      
      let assigneeName = 'N/A';
      // Use lawyer_profile to get the name, checking if it's an array and has elements
      if (app.lawyer_profile && app.lawyer_profile.length > 0 && app.lawyer_profile[0]?.full_name) {
        assigneeName = app.lawyer_profile[0].full_name;
      }


      eventsByDay[dayKey].push({
        id: app.id,
        name: `${app.title || 'No Title'} (${assigneeName})`,
        time: format(startTime, 'p'), // e.g., 2:00 PM
        datetime: app.start_time,
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
    openDialog(<CreateAppointmentDialog />);
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
    />
  );
};
