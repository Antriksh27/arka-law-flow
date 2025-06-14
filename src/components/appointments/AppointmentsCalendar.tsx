
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FilterState } from '../../pages/Appointments';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
  Check,
  MapPin,
  Phone,
  AlertCircle,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { format, getDay, getHours, parseISO } from 'date-fns';
import type { Icon as LucideIcon } from 'lucide-react';

interface AppointmentsCalendarProps {
  filters: FilterState; // Kept for future use
}

// Static configuration for the calendar grid
const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']; // For 5-day week view
const timeSlots = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM'
  // Add more time slots if needed, each representing an hour.
];

// --- Helper Functions ---
const getInitials = (name?: string | null): string => {
  if (!name) return 'N/A';
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase() || 'N/A';
};

const typeDisplayMap: { [key: string]: { text: string; icon: LucideIcon } } = {
  virtual_meeting: { text: 'Video Call', icon: Video },
  in_person_meeting: { text: 'Office Meeting', icon: MapPin },
  phone_call: { text: 'Phone Call', icon: Phone },
};

const statusConfigMap: {
  [key:string]: {
    displayStatus: string;
    badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
    badgeClasses: string;
    icon: LucideIcon;
    cardClasses: string;
    avatarFallbackClasses: string;
  }
} = {
  upcoming: {
    displayStatus: 'Upcoming',
    badgeVariant: 'default',
    badgeClasses: 'bg-accentBlue text-primaryBlue border-blue-200',
    icon: Clock,
    cardClasses: 'bg-accentBlue text-primaryBlue',
    avatarFallbackClasses: 'bg-blue-200 text-primaryBlue',
  },
  completed: {
    displayStatus: 'Completed',
    badgeVariant: 'secondary', // Visually distinct from default
    badgeClasses: 'bg-green-100 text-green-700 border-green-200',
    icon: Check,
    cardClasses: 'bg-green-100 text-green-700',
    avatarFallbackClasses: 'bg-green-200 text-green-800',
  },
  pending: {
    displayStatus: 'Pending',
    badgeVariant: 'outline',
    badgeClasses: 'border-yellow-400 text-yellow-700 bg-yellow-50',
    icon: Clock, // Or another appropriate icon
    cardClasses: 'bg-yellow-50 text-yellow-700',
    avatarFallbackClasses: 'bg-yellow-200 text-yellow-800',
  },
  cancelled: {
    displayStatus: 'Cancelled',
    badgeVariant: 'destructive',
    badgeClasses: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertCircle, // Or XCircle
    cardClasses: 'bg-red-100 text-red-700',
    avatarFallbackClasses: 'bg-red-200 text-red-800',
  },
  rescheduled: {
    displayStatus: 'Rescheduled',
    badgeVariant: 'outline',
    badgeClasses: 'border-purple-400 text-purple-700 bg-purple-50',
    icon: Clock, // Or CalendarClock
    cardClasses: 'bg-purple-50 text-purple-700',
    avatarFallbackClasses: 'bg-purple-200 text-purple-800',
  },
  default: {
    displayStatus: 'Unknown',
    badgeVariant: 'outline',
    badgeClasses: 'border-gray-300 text-gray-700 bg-gray-100',
    icon: AlertCircle,
    cardClasses: 'bg-gray-100 text-gray-700',
    avatarFallbackClasses: 'bg-gray-200 text-gray-700',
  }
};

interface ProcessedAppointment {
  id: string;
  dayIndex: number;
  timeIndex: number;
  title: string;
  statusConfig: typeof statusConfigMap.default;
  assignee: string;
  typeInfo: typeof typeDisplayMap.virtual_meeting;
}

// --- Component ---
export const AppointmentsCalendar: React.FC<AppointmentsCalendarProps> = ({
  filters,
}) => {
  // For now, hardcode the week. This should be dynamic in a full implementation.
  // April 22, 2024 (Monday) to April 26, 2024 (Friday)
  const currentWeekStart = new Date('2024-04-22T00:00:00Z');
  const currentWeekViewEnd = new Date('2024-04-27T00:00:00Z'); // Exclusive: covers up to end of April 26th

  const calendarDisplayDays = React.useMemo(() => {
    return daysOfWeek.map((dayPrefix, index) => {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + index);
      return `${dayPrefix}, ${format(date, 'dd')}`;
    });
  }, [currentWeekStart]);

  const { data: rawAppointments, isLoading, error } = useQuery({
    queryKey: ['appointments', format(currentWeekStart, 'yyyy-MM-dd')],
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
          profiles ( full_name )
        `)
        .gte('start_time', currentWeekStart.toISOString())
        .lt('start_time', currentWeekViewEnd.toISOString())
        .order('start_time', { ascending: true });

      if (dbError) {
        console.error('Error fetching appointments:', dbError);
        throw dbError;
      }
      return data || [];
    },
  });

  const processedAppointments = React.useMemo((): ProcessedAppointment[] => {
    if (!rawAppointments) return [];
    return rawAppointments.map((app) => {
      const startTime = app.start_time ? parseISO(app.start_time) : new Date(); // Fallback, though start_time should exist
      
      // getDay: 0 (Sun) - 6 (Sat). We want Mon (0) - Fri (4)
      // If start_time is on Sunday (0), map to -1 (won't display) or handle as needed
      // If start_time is on Saturday (6), map to 5 (won't display on 5-day view)
      let dayIndex = getDay(startTime) - 1; 
      if (getDay(startTime) === 0) dayIndex = 6; // Sunday as 6, effectively out of Mon-Fri=0-4 range

      const timeIndex = getHours(startTime) - 9; // Assuming 9 AM is the first slot (index 0)

      const appStatus = (app.status || 'default').toLowerCase();
      const statusConfig = statusConfigMap[appStatus] || statusConfigMap.default;
      
      const appType = (app.type || 'unknown_type').toLowerCase();
      const typeInfo = typeDisplayMap[appType] || { text: 'Unknown Type', icon: HelpCircle };

      return {
        id: app.id,
        dayIndex,
        timeIndex,
        title: app.title || 'No Title',
        statusConfig,
        assignee: getInitials(app.profiles?.full_name),
        typeInfo,
      };
    }).filter(app => app.dayIndex >= 0 && app.dayIndex < daysOfWeek.length && app.timeIndex >=0 && app.timeIndex < timeSlots.length); // Filter for valid slots
  }, [rawAppointments]);


  return (
    <div className="bg-white border border-borderGray rounded-2xl shadow-sm w-full p-6 flex flex-col gap-6">
      {/* Calendar Controls */}
      <div className="flex w-full items-center gap-2 sm:gap-4 flex-wrap">
        <Button variant="outline" className="border-gray-300 hover:bg-gray-100 text-gray-700">
          Today
        </Button>
        <div className="flex items-center">
          <Button variant="outline" size="icon" className="h-9 w-9 border-gray-300 hover:bg-gray-100 text-gray-700">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9 border-gray-300 ml-1 hover:bg-gray-100 text-gray-700">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-lg font-medium text-textBase">
          {`${format(currentWeekStart, 'MMMM dd')} - ${format(new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate() + 4), 'dd, yyyy')}`}
        </span>
      </div>

      {/* Calendar Grid */}
      <div className="flex flex-col w-full overflow-x-auto">
        <div className="flex w-full min-w-[800px]"> {/* min-width for horizontal scroll */}
          {/* Time Gutter */}
          <div className="w-24 md:w-28 flex-none py-2 pr-2 text-sm text-textMuted">
            {/* Empty cell for alignment with day headers */}
          </div>
          {/* Day Headers */}
          {calendarDisplayDays.map(day => (
            <div key={day} className="flex-1 min-w-[150px] text-center font-medium text-textBase p-2 border-b border-borderGray">
              {day}
            </div>
          ))}
        </div>

        <div className="flex w-full min-w-[800px] flex-1"> {/* min-width for horizontal scroll */}
          {/* Time Slots Column */}
          <div className="w-24 md:w-28 flex-none">
            {timeSlots.map(time => (
              <div key={time} className="h-24 flex items-start justify-end pr-2 pt-1 border-r border-borderGray">
                <span className="text-xs text-textMuted">{time}</span>
              </div>
            ))}
          </div>

          {/* Appointment Slots Grid */}
          {daysOfWeek.map((_, dayIndex) => (
            <div key={`day-col-${dayIndex}`} className="flex-1 flex flex-col border-l border-borderGray">
              {timeSlots.map((time, timeIndex) => (
                <div key={`slot-${dayIndex}-${timeIndex}`} className="h-24 border-b border-borderGray relative p-1">
                  {isLoading && dayIndex === 0 && timeIndex === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
                      <Loader2 className="h-6 w-6 animate-spin text-primaryBlue" />
                    </div>
                  )}
                  {error && dayIndex === 0 && timeIndex === 0 && (
                     <div className="text-red-500 p-2 text-xs">Error loading.</div>
                  )}
                  {processedAppointments
                    .filter(app => app.dayIndex === dayIndex && app.timeIndex === timeIndex)
                    .map(app => {
                      const AppTypeIcon = app.typeInfo.icon;
                      const AppStatusIcon = app.statusConfig.icon;
                      return (
                        <div 
                          key={app.id} 
                          className={`rounded-lg p-2 text-xs shadow-sm ${app.statusConfig.cardClasses} mb-1`}
                          title={app.title}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <Badge
                              variant={app.statusConfig.badgeVariant}
                              className={app.statusConfig.badgeClasses}
                            >
                              <AppStatusIcon className="mr-1 h-3 w-3" />
                              {app.statusConfig.displayStatus}
                            </Badge>
                            <Avatar className="h-6 w-6 text-xs">
                              <AvatarFallback className={`${app.statusConfig.avatarFallbackClasses} font-semibold`}>
                                {app.assignee}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <p className="font-semibold mb-0.5 truncate text-sm">{app.title}</p>
                          <div className="flex items-center">
                            <AppTypeIcon className="mr-1 h-3 w-3" />
                            <span>{app.typeInfo.text}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

