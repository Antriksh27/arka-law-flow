import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useDialog } from '@/hooks/use-dialog';
import { ViewAppointmentDialog } from './ViewAppointmentDialog';
import { CreateAppointmentDialog } from './CreateAppointmentDialog';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, User, MapPin, Plus, Video, Phone } from 'lucide-react';

interface AppointmentData {
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
  client_name?: string;
  client_id?: string | null;
  case_id?: string | null;
  duration_minutes?: number;
}

interface DayAppointmentsDialogProps {
  selectedDate: Date;
  appointments: AppointmentData[];
  onClose: () => void;
}

export const DayAppointmentsDialog: React.FC<DayAppointmentsDialogProps> = ({
  selectedDate,
  appointments,
  onClose,
}) => {
  const { openDialog, closeDialog } = useDialog();

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'No time';
    try {
      return format(parseISO(`2000-01-01T${timeString}`), 'h:mm a');
    } catch {
      return timeString;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>;
      case 'arrived':
        return <Badge className="bg-green-100 text-green-800">Arrived</Badge>;
      case 'late':
        return <Badge className="bg-orange-100 text-orange-800">Late</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'rescheduled':
        return <Badge className="bg-purple-100 text-purple-800">Rescheduled</Badge>;
      case 'in-progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
    }
  };

  const getLocationIcon = (location: string | null) => {
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

  const handleAppointmentClick = (appointment: AppointmentData) => {
    onClose(); // Close the current dialog first
    openDialog(
      <ViewAppointmentDialog 
        appointment={{
          id: appointment.id,
          title: appointment.title,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          status: appointment.status,
          type: appointment.type,
          lawyer_id: appointment.lawyer_id,
          lawyer_name: appointment.lawyer_name,
          location: appointment.location,
          notes: appointment.notes,
          client_name: appointment.client_name,
          client_id: appointment.client_id,
          case_id: appointment.case_id,
          duration_minutes: appointment.duration_minutes || 60
        }}
      />
    );
  };

  const handleNewAppointment = () => {
    onClose(); // Close the current dialog first
    openDialog(<CreateAppointmentDialog preSelectedDate={selectedDate} />);
  };

  // Sort appointments by time
  const sortedAppointments = [...appointments].sort((a, b) => {
    if (!a.appointment_time && !b.appointment_time) return 0;
    if (!a.appointment_time) return 1;
    if (!b.appointment_time) return -1;
    return a.appointment_time.localeCompare(b.appointment_time);
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <Calendar className="h-5 w-5 text-blue-600" />
            Appointments for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add New Appointment Button */}
          <div className="flex justify-end">
            <Button onClick={handleNewAppointment} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Appointment
            </Button>
          </div>

          {/* Appointments List */}
          {sortedAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">No appointments scheduled</p>
              <p className="text-sm">Click "New Appointment" to schedule one for this date.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => handleAppointmentClick(appointment)}
                >
                  {/* Time */}
                  <div className="flex flex-col items-center gap-1 min-w-[80px]">
                    <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                      <Clock className="h-4 w-4" />
                      {formatTime(appointment.appointment_time)}
                    </div>
                    {appointment.duration_minutes && (
                      <span className="text-xs text-gray-500">
                        {appointment.duration_minutes} min
                      </span>
                    )}
                  </div>

                  {/* Appointment Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 line-clamp-1">
                        {appointment.title || 'Untitled Appointment'}
                      </h3>
                      {getStatusBadge(appointment.status)}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {/* Client */}
                      {appointment.client_name && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{appointment.client_name}</span>
                        </div>
                      )}

                      {/* Lawyer */}
                      {appointment.lawyer_name && (
                        <div className="flex items-center gap-1">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-xs">
                              {appointment.lawyer_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span>{appointment.lawyer_name}</span>
                        </div>
                      )}

                      {/* Location */}
                      {appointment.location && (
                        <div className="flex items-center gap-1">
                          {getLocationIcon(appointment.location)}
                          <span>
                            {appointment.location === 'online' ? 'Video Call' : 
                             appointment.location === 'phone' ? 'Phone Call' : 
                             appointment.location === 'in_person' ? 'Office' : 
                             appointment.location}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};