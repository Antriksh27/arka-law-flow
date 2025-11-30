import React from 'react';
import { format, parseISO } from 'date-fns';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Video, MapPin, Phone, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileAppointmentCardProps {
  appointment: {
    id: string;
    title: string;
    appointment_date: string;
    appointment_time: string;
    duration_minutes: number;
    client_name: string;
    status: string;
    location: string;
    type?: string;
  };
  onClick: () => void;
}

export const MobileAppointmentCard: React.FC<MobileAppointmentCardProps> = ({
  appointment,
  onClick,
}) => {
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
        return 'border-l-blue-500';
      case 'arrived':
      case 'completed':
        return 'border-l-green-500';
      case 'late':
        return 'border-l-orange-500';
      case 'rescheduled':
        return 'border-l-purple-500';
      case 'in-progress':
        return 'border-l-yellow-500';
      case 'cancelled':
        return 'border-l-red-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="default" className="text-xs">Confirmed</Badge>;
      case 'arrived':
        return <Badge className="bg-green-100 text-green-800 text-xs">Arrived</Badge>;
      case 'late':
        return <Badge className="bg-orange-100 text-orange-800 text-xs">Late</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-600 text-xs">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="error" className="text-xs">Cancelled</Badge>;
      case 'rescheduled':
        return <Badge className="bg-purple-100 text-purple-800 text-xs">Rescheduled</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Pending</Badge>;
    }
  };

  const getLocationIcon = (location: string) => {
    switch (location?.toLowerCase()) {
      case 'online':
        return <Video className="w-4 h-4 text-muted-foreground" />;
      case 'phone':
        return <Phone className="w-4 h-4 text-muted-foreground" />;
      case 'in_person':
      default:
        return <MapPin className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl border-l-4 shadow-sm p-4 active:scale-[0.98] transition-all cursor-pointer",
        getStatusColor(appointment.status)
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="text-sm bg-primary/10 text-primary">
              {appointment.client_name?.split(' ').map(n => n[0]).join('') || 'C'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">
              {appointment.client_name || 'Contact'}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {appointment.title?.replace(/^(In-Person Meeting|Video Call|Phone Call)/i, 'Appointment') || 'Appointment'}
            </p>
          </div>
        </div>
        {getStatusBadge(appointment.status)}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span className="font-medium">{formatTime(appointment.appointment_time)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {getLocationIcon(appointment.location)}
          <span>
            {appointment.location === 'online' ? 'Video' : 
             appointment.location === 'phone' ? 'Phone' : 
             'Office'}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {appointment.duration_minutes} min
        </div>
      </div>
    </div>
  );
};
