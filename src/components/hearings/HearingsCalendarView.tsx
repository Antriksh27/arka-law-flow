import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FilterState } from './types';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useDialog } from '@/hooks/use-dialog';
import { HearingDetailsModal } from './HearingDetailsModal';
import { DayHearingsDialog } from './DayHearingsDialog';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ArrowRight } from 'lucide-react';

const localizer = momentLocalizer(moment);

interface HearingsCalendarViewProps {
  filters: FilterState;
}

interface CalendarEvent extends Event {
  resource: any;
}

export const HearingsCalendarView: React.FC<HearingsCalendarViewProps> = ({ filters }) => {
  const { openDialog } = useDialog();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [date, setDate] = useState<Date>(new Date());

  const { data: hearings, isLoading } = useQuery({
    queryKey: ['hearings-calendar', filters],
    queryFn: async () => {
      console.debug('🔍 Fetching hearings with filters:', filters);
      
      let query = supabase
        .from('case_hearings')
        .select(`
          *,
          cases!inner(
            case_title,
            case_number,
            registration_number,
            court_name,
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

      if (filters.case && filters.case !== 'all') {
        query = query.eq('case_id', filters.case);
      }
      
      if (filters.court && filters.court !== 'all') {
        query = query.eq('cases.court_name', filters.court);
      }
      
      if (filters.clientId) {
        query = query.eq('cases.client_id', filters.clientId);
      }
      
      if (filters.searchQuery) {
        query = query.or(
          `judge.ilike.%${filters.searchQuery}%,` +
          `purpose_of_hearing.ilike.%${filters.searchQuery}%,` +
          `cause_list_type.ilike.%${filters.searchQuery}%`
        );
      }

      const { data, error } = await query.order('hearing_date', { ascending: true });
      if (error) {
        console.error('❌ Error fetching hearings:', error);
        throw error;
      }
      
      console.debug('✅ Fetched hearings:', data?.length || 0, 'hearings');
      return data || [];
    }
  });

  // Auto-navigate to nearest upcoming hearing
  useEffect(() => {
    if (!hearings?.length) return;
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const upcomingHearings = hearings
      .map(h => parseISO(h.hearing_date))
      .filter(d => d >= todayStart)
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (upcomingHearings.length > 0) {
      const nextHearing = upcomingHearings[0];
      console.debug('📅 Next hearing date:', format(nextHearing, 'yyyy-MM-dd'));
      
      const monthChanged =
        nextHearing.getFullYear() !== date.getFullYear() ||
        nextHearing.getMonth() !== date.getMonth();
      
      if (monthChanged) {
        setDate(nextHearing);
        console.debug('🔄 Calendar navigated to:', format(nextHearing, 'MMMM yyyy'));
      }
    }
  }, [hearings]);

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
          queryClient.invalidateQueries({ queryKey: ['hearings-calendar'], exact: false });
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
      .filter(hearing => hearing.hearing_date)
      .map(hearing => {
        // Use actual hearing_time if available, otherwise default to start of day
        const startTime = hearing.hearing_time 
          ? parseISO(`${hearing.hearing_date}T${hearing.hearing_time}`)
          : parseISO(hearing.hearing_date);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

        return {
          title: hearing.cases?.case_title || 'Untitled Case',
          start: startTime,
          end: endTime,
          resource: hearing,
          allDay: !hearing.hearing_time // Only treat as all-day if no time is set
        };
      });
  }, [hearings]);

  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: '#1E3A8A',
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

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    const selectedDate = slotInfo.start;
    const dayHearings = hearings?.filter(h => {
      const hearingDate = parseISO(h.hearing_date);
      return format(hearingDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
    }) || [];

    openDialog(
      <DayHearingsDialog
        selectedDate={selectedDate}
        hearings={dayHearings}
        onClose={() => {}}
      />
    );
  };

  const handleGoToToday = () => {
    setDate(new Date());
  };

  const handleNextHearing = () => {
    if (!hearings?.length) return;
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const nextHearing = hearings
      .map(h => parseISO(h.hearing_date))
      .filter(d => d >= todayStart)
      .sort((a, b) => a.getTime() - b.getTime())[0];
    
    if (nextHearing) {
      setDate(nextHearing);
    }
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
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGoToToday}
          className="flex items-center gap-2"
        >
          <CalendarIcon className="w-4 h-4" />
          Go to Today
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextHearing}
          className="flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          Next Hearing
        </Button>
        <div className="ml-auto text-sm text-[#6B7280]">
          {hearings?.length || 0} upcoming hearing{hearings?.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="h-[700px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          views={['month', 'week', 'day']}
          popup
        />
      </div>
    </div>
  );
};
