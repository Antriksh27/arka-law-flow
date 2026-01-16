import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FilterState } from '../../pages/Appointments';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, startOfDay, isSameDay } from 'date-fns';
import TimeUtils from '@/lib/timeUtils';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { IconButton } from '../messages/ui/IconButton';
import { MoreHorizontal, Video, MapPin, Phone, Calendar, Plus } from 'lucide-react';
import { Loader2, AlertCircle } from 'lucide-react';
import { ViewAppointmentDialog } from './ViewAppointmentDialog';
import { useDialog } from '@/hooks/use-dialog';
import { EmptyState } from '../ui/empty-state';
import { Skeleton } from '../ui/skeleton';
import { useNavigate } from 'react-router-dom';

interface AppointmentsTimelineProps {
  filters: FilterState;
}

interface Appointment {
  id: string;
  title: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  client_name: string;
  case_title: string;
  assigned_user_name: string;
  status: string;
  location: string;
  notes?: string;
  client_id?: string;
  case_id?: string;
  lawyer_id?: string;
  type?: string;
}

export const AppointmentsTimeline: React.FC<AppointmentsTimelineProps> = ({
  filters,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openDialog } = useDialog();

  const { data: appointments, isLoading, error } = useQuery<Appointment[], Error>({
    queryKey: ['appointments-timeline', user?.id, filters.showPastAppointments, filters.searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('appointment_details')
        .select('*')
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: true });
      
      // Filter by current lawyer only
      if (user?.id) {
        query = query.eq('lawyer_id', user.id);
      }
      
      // Filter by date in IST - show only future appointments by default
      if (!filters.showPastAppointments) {
        const today = TimeUtils.formatDateInput(TimeUtils.nowDate());
        query = query.gte('appointment_date', today);
      }
      
      if (filters.searchQuery) {
        query = query.or(`client_name.ilike.%${filters.searchQuery}%,case_title.ilike.%${filters.searchQuery}%,notes.ilike.%${filters.searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Enrich appointments with contact names when no client is present
      const enrichedAppointments = await Promise.all(
        (data || []).map(async (appointment) => {
          // If no client_name but title exists, try to extract client name and find contact
          if (!appointment.client_name && appointment.title?.startsWith('Appointment with ')) {
            const extractedName = appointment.title.replace('Appointment with ', '');
            
            // Try to find contact with this name
            const { data: contactData } = await supabase
              .from('contacts')
              .select('name')
              .ilike('name', `%${extractedName.trim()}%`)
              .limit(1);
            
            if (contactData && contactData.length > 0) {
              return {
                ...appointment,
                client_name: contactData[0].name,
                is_contact: true
              };
            }
            
            return {
              ...appointment,
              client_name: extractedName,
              is_contact: true
            };
          }
          
          return appointment;
        })
      );

      return enrichedAppointments || [];
    },
  });

  // Group appointments by category: today, upcoming, past
  const categorizedAppointments = useMemo(() => {
    if (!appointments) return { today: {}, upcoming: {}, past: {} };
    
    const today = TimeUtils.nowDate();
    const todayStr = TimeUtils.formatDateInput(today);
    
    const categories = {
      today: {} as Record<string, Appointment[]>,
      upcoming: {} as Record<string, Appointment[]>,
      past: {} as Record<string, Appointment[]>
    };
    
    appointments.forEach((appointment) => {
      const appointmentDate = parseISO(appointment.appointment_date);
      const dateStr = appointment.appointment_date;
      
      let category: 'today' | 'upcoming' | 'past';
      
      if (dateStr === todayStr) {
        category = 'today';
      } else if (appointmentDate > today) {
        category = 'upcoming';
      } else {
        category = 'past';
      }
      
      if (!categories[category][dateStr]) {
        categories[category][dateStr] = [];
      }
      categories[category][dateStr].push(appointment);
    });
    
    return categories;
  }, [appointments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="success">Confirmed</Badge>;
      case 'arrived':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Arrived</Badge>;
      case 'late':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Late</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="error">Cancelled</Badge>;
      case 'rescheduled':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Rescheduled</Badge>;
      case 'in-progress':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">In Progress</Badge>;
      default:
        return <Badge>Pending</Badge>;
    }
  };

  const getLocationIcon = (location: string) => {
    switch (location?.toLowerCase()) {
      case 'online':
        return <Video className="w-4 h-4 text-gray-400" />;
      case 'phone':
        return <Phone className="w-4 h-4 text-gray-400" />;
      case 'in_person':
      default:
        return <MapPin className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDateHeader = (dateString: string) => {
    const date = TimeUtils.toISTDate(dateString);
    if (!date) return dateString;
    
    if (TimeUtils.isToday(date)) return 'Today';
    
    const tomorrow = TimeUtils.addDaysIST(TimeUtils.nowDate(), 1);
    if (TimeUtils.formatDateInput(date) === TimeUtils.formatDateInput(tomorrow)) return 'Tomorrow';
    
    const yesterday = TimeUtils.addDaysIST(TimeUtils.nowDate(), -1);
    if (TimeUtils.formatDateInput(date) === TimeUtils.formatDateInput(yesterday)) return 'Yesterday';
    
    return TimeUtils.formatDate(date, 'EEEE, MMMM d');
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      return format(parseISO(`2000-01-01T${timeString}`), 'h:mm a');
    } catch {
      return timeString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-600';
      case 'arrived':
      case 'completed':
        return 'bg-green-600';
      case 'late':
        return 'bg-orange-600';
      case 'rescheduled':
        return 'bg-purple-600';
      case 'in-progress':
        return 'bg-yellow-600';
      case 'cancelled':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const handleAppointmentClick = (appointment: Appointment) => {
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

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-24 h-20 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-red-600">
        <AlertCircle className="h-12 w-12" />
        <span className="mt-4 text-lg">Error loading appointments</span>
        <p className="text-sm text-gray-600">{error.message}</p>
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No appointments scheduled"
        description="Your upcoming appointments will appear here. Schedule your first appointment to get started."
        actionLabel="Schedule Appointment"
        actionIcon={Plus}
        onAction={() => navigate('/appointments?create=true')}
      />
    );
  }

  const renderAppointmentSection = (title: string, appointments: Record<string, Appointment[]>, sortOrder: 'asc' | 'desc') => {
    const entries = Object.entries(appointments);
    if (entries.length === 0) return null;

    return (
      <div className="flex w-full flex-col items-start">
        <div className="flex w-full items-center gap-2 px-4 py-3 bg-gray-50">
          <span className="text-lg font-semibold text-gray-700">
            {title}
          </span>
        </div>
        {entries
          .sort(([a], [b]) => {
            const dateA = new Date(a).getTime();
            const dateB = new Date(b).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
          })
          .map(([date, dayAppointments]) => (
          <div key={date} className="flex w-full flex-col items-start">
            <div className="flex w-full items-center gap-2 px-4 py-3 border-b border-gray-100">
              <span className="text-base font-medium text-gray-900">
                {formatDateHeader(date)}
              </span>
            </div>
            {dayAppointments.map((appointment, index) => (
            <div
              key={appointment.id}
              className="flex w-full items-center gap-4 border-b border-gray-200 px-4 py-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => handleAppointmentClick(appointment)}
            >
              <div className="flex flex-col items-start gap-1">
                <span className="text-sm font-semibold text-gray-900">
                  {formatTime(appointment.appointment_time)}
                </span>
                <span className="text-xs text-gray-500">
                  {appointment.duration_minutes} min
                </span>
              </div>
              <div className={`flex w-1 flex-none flex-col items-center gap-2 self-stretch overflow-hidden rounded-md ${getStatusColor(appointment.status)}`} />
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1">
                <div className="flex w-full items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {appointment.client_name 
                      ? `Appointment with ${appointment.client_name}` 
                      : appointment.title?.replace(/^(In-Person Meeting|Video Call|Phone Call)/i, 'Appointment') || 'Appointment'
                    }
                  </span>
                  {getStatusBadge(appointment.status)}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {appointment.client_name?.split(' ').map(n => n[0]).join('') || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-gray-600">
                      {appointment.client_name || 'Contact'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {getLocationIcon(appointment.location)}
                    <span className="text-xs text-gray-600">
                      {appointment.location === 'online' ? 'Video Call' : 
                       appointment.location === 'phone' ? 'Phone Call' : 
                       appointment.location === 'in_person' ? 'Office Visit' : 
                       appointment.location || 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>
              <IconButton
                icon={<MoreHorizontal className="w-4 h-4" />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAppointmentClick(appointment);
                }}
              />
            </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col items-start">
      {renderAppointmentSection("Today's Appointments", categorizedAppointments.today, 'asc')}
      {renderAppointmentSection("Upcoming Appointments", categorizedAppointments.upcoming, 'asc')}
      {renderAppointmentSection("Past Appointments", categorizedAppointments.past, 'desc')}
    </div>
  );
};