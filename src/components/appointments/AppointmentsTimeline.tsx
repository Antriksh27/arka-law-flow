import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FilterState } from '../../pages/Appointments';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, startOfDay, isSameDay, isToday, isTomorrow, isYesterday } from 'date-fns';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { IconButton } from '../messages/ui/IconButton';
import { MoreHorizontal, Video, MapPin, Phone } from 'lucide-react';
import { Loader2, AlertCircle } from 'lucide-react';
import { ViewAppointmentDialog } from './ViewAppointmentDialog';
import { useDialog } from '@/hooks/use-dialog';

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
      
      // Filter by date - show only future appointments by default
      if (!filters.showPastAppointments) {
        const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
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

  // Group appointments by date
  const groupedAppointments = useMemo(() => {
    if (!appointments) return {};
    
    return appointments.reduce((groups, appointment) => {
      const date = appointment.appointment_date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(appointment);
      return groups;
    }, {} as Record<string, Appointment[]>);
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
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d');
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
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-4 text-lg text-gray-600">Loading appointments...</span>
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
      <div className="flex flex-col items-center justify-center p-10 text-gray-500">
        <div className="text-lg">No appointments found</div>
        <p className="text-sm">Your appointments will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-start">
      {Object.entries(groupedAppointments)
        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
        .map(([date, dayAppointments]) => (
        <div key={date} className="flex w-full flex-col items-start">
          <div className="flex w-full items-center gap-2 px-4 py-4">
            <span className="text-xl font-semibold text-gray-900">
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
                    {appointment.client_name ? `Appointment with ${appointment.client_name}` : appointment.title || 'Appointment'}
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