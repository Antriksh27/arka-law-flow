import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FilterState } from './types';
import { format, parseISO } from 'date-fns';
import { useDialog } from '@/hooks/use-dialog';
import { HearingDetailsModal } from './HearingDetailsModal';
import { toast } from '@/hooks/use-toast';

const localizer = momentLocalizer(moment);

interface HearingsCalendarViewProps {
  filters: FilterState;
}

interface CalendarEvent extends Event {
  resource: any; // Use any for flexibility with case_hearings data
}

export const HearingsCalendarView: React.FC<HearingsCalendarViewProps> = ({ filters }) => {
  const { openDialog } = useDialog();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const { data: hearings, isLoading } = useQuery({
    queryKey: ['hearings-calendar', filters],
    queryFn: async () => {
      let query = supabase
        .from('case_hearings')
        .select(`
          *,
          cases(
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
        // case_hearings doesn't have status field, skip this filter
      }
      if (filters.case && filters.case !== 'all') {
        query = query.eq('case_id', filters.case);
      }
      if (filters.court && filters.court !== 'all') {
        // case_hearings doesn't have court_name field, skip this filter
      }
      if (filters.assignedUser && filters.assignedUser !== 'all') {
        // case_hearings doesn't have assigned_to field, skip this filter
      }
      if (filters.searchQuery) {
        query = query.or(
          `judge.ilike.%${filters.searchQuery}%,` +
          `purpose_of_hearing.ilike.%${filters.searchQuery}%,` +
          `cause_list_type.ilike.%${filters.searchQuery}%`
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
      .channel('case-hearings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'case_hearings'
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

    return hearings
      .filter(hearing => hearing.hearing_date) // Only show hearings with dates
      .map(hearing => {
        const date = parseISO(hearing.hearing_date);
        let startTime = date;
        let endTime = date;

        // Since case_hearings doesn't have hearing_time, all events are all-day
        return {
          title: hearing.cases?.case_title || 'Untitled Case',
          start: startTime,
          end: endTime,
          resource: hearing,
          allDay: true
        };
      });
  }, [hearings]);

  const eventStyleGetter = (event: CalendarEvent) => {
    // case_hearings doesn't have status field, use default color
    let backgroundColor = '#1E3A8A'; // Default blue

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
