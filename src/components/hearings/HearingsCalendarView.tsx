import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FilterState, Hearing } from './types';
import { format, parseISO } from 'date-fns';
import { useDialog } from '@/hooks/use-dialog';
import { HearingDetailsModal } from './HearingDetailsModal';
import { toast } from '@/hooks/use-toast';

const localizer = momentLocalizer(moment);

interface HearingsCalendarViewProps {
  filters: FilterState;
}

interface CalendarEvent extends Event {
  resource: Hearing & { cases?: any };
}

export const HearingsCalendarView: React.FC<HearingsCalendarViewProps> = ({ filters }) => {
  const { openDialog } = useDialog();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const { data: hearings, isLoading } = useQuery({
    queryKey: ['hearings-calendar', filters],
    queryFn: async () => {
      let query = supabase
        .from('hearings')
        .select(`
          *,
          cases!hearings_case_id_fkey(
            case_title, 
            case_number,
            client_id,
            clients(full_name)
          )
        `);

      const today = format(new Date(), 'yyyy-MM-dd');
      query = query.gte('hearing_date', today);

      if (filters.dateRange.from && filters.dateRange.to) {
        query = query
          .gte('hearing_date', format(filters.dateRange.from, 'yyyy-MM-dd'))
          .lte('hearing_date', format(filters.dateRange.to, 'yyyy-MM-dd'));
      }

      if (filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.case && filters.case !== 'all') {
        query = query.eq('case_id', filters.case);
      }
      if (filters.court && filters.court !== 'all') {
        query = query.ilike('court_name', `%${filters.court}%`);
      }
      if (filters.assignedUser && filters.assignedUser !== 'all') {
        query = query.eq('assigned_to', filters.assignedUser);
      }
      if (filters.searchQuery) {
        query = query.or(
          `court_name.ilike.%${filters.searchQuery}%,` +
          `hearing_type.ilike.%${filters.searchQuery}%,` +
          `notes.ilike.%${filters.searchQuery}%`
        );
      }

      const { data, error } = await query.order('hearing_date', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('hearings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hearings'
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['hearings-calendar'] });
          toast({
            title: 'Hearing updated',
            description: 'The hearings list has been updated.'
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const events: CalendarEvent[] = useMemo(() => {
    if (!hearings) return [];

    return hearings.map(hearing => {
      const date = parseISO(hearing.hearing_date);
      let startTime = date;
      let endTime = date;

      if (hearing.hearing_time) {
        const [hours, minutes] = hearing.hearing_time.split(':');
        startTime = new Date(date);
        startTime.setHours(parseInt(hours), parseInt(minutes));
        endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + 1);
      }

      return {
        title: hearing.cases?.case_title || 'Untitled Case',
        start: startTime,
        end: endTime,
        resource: hearing,
        allDay: !hearing.hearing_time
      };
    });
  }, [hearings]);

  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status;
    let backgroundColor = '#1E3A8A'; // Default blue
    
    if (status === 'scheduled') backgroundColor = '#10B981'; // Green
    if (status === 'adjourned') backgroundColor = '#F59E0B'; // Yellow
    if (status === 'completed') backgroundColor = '#6B7280'; // Gray
    if (status === 'cancelled') backgroundColor = '#EF4444'; // Red

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.875rem',
        padding: '4px 8px'
      }
    };
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    openDialog(<HearingDetailsModal hearing={event.resource} />);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-base text-[#6B7280]">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
      <div className="h-[700px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          view={view}
          onView={setView}
          views={['month', 'week', 'day']}
          popup
        />
      </div>
    </div>
  );
};
