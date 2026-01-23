import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useDialog } from '@/hooks/use-dialog';
import { ViewAppointmentDialog } from './ViewAppointmentDialog';
import { CreateAppointmentDialog } from './CreateAppointmentDialog';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, User, MapPin, Plus, Video, Phone, X } from 'lucide-react';

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
  daily_serial_number?: number;
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
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      upcoming: { bg: 'bg-sky-50', text: 'text-sky-700', label: 'Upcoming' },
      arrived: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Arrived' },
      late: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Late' },
      completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Completed' },
      cancelled: { bg: 'bg-red-50', text: 'text-red-700', label: 'Cancelled' },
      rescheduled: { bg: 'bg-violet-50', text: 'text-violet-700', label: 'Rescheduled' },
      'in-progress': { bg: 'bg-amber-50', text: 'text-amber-700', label: 'In Progress' },
    };
    const config = statusConfig[status?.toLowerCase() || ''] || { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Pending' };
    return <Badge className={`${config.bg} ${config.text} border-0 rounded-full`}>{config.label}</Badge>;
  };

  const getLocationIcon = (location: string | null) => {
    switch (location?.toLowerCase()) {
      case 'online': return <Video className="w-4 h-4 text-slate-400" />;
      case 'phone': return <Phone className="w-4 h-4 text-slate-400" />;
      default: return <MapPin className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleAppointmentClick = (appointment: AppointmentData) => {
    closeDialog();
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
    closeDialog();
    openDialog(<CreateAppointmentDialog preSelectedDate={selectedDate} />);
  };

  const sortedAppointments = [...appointments].sort((a, b) => {
    if (!a.appointment_time && !b.appointment_time) return 0;
    if (!a.appointment_time) return 1;
    if (!b.appointment_time) return -1;
    return a.appointment_time.localeCompare(b.appointment_time);
  });

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="px-6 py-5 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-sky-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {format(selectedDate, 'EEEE, MMMM d')}
              </h2>
              <p className="text-sm text-slate-500">{sortedAppointments.length} appointment(s)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Add New Appointment Button */}
        <Button 
          onClick={handleNewAppointment} 
          className="w-full mb-4 rounded-xl h-12 bg-slate-800 hover:bg-slate-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>

        {/* Appointments List */}
        {sortedAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-900">No appointments scheduled</p>
            <p className="text-sm text-slate-500 mt-1">Click "New Appointment" to schedule one for this date.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-md cursor-pointer transition-all active:scale-[0.99]"
                onClick={() => handleAppointmentClick(appointment)}
              >
                <div className="flex items-start gap-4">
                  {/* Token Number */}
                  {appointment.daily_serial_number && (
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-xl px-3 py-2 text-center min-w-[50px] shadow-sm">
                        <div className="text-[8px] font-semibold uppercase tracking-widest opacity-70 mb-0.5">Token</div>
                        <div className="text-lg font-bold leading-none">{appointment.daily_serial_number}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Time */}
                  <div className="flex flex-col items-center gap-1 min-w-[70px]">
                    <div className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                      <Clock className="h-4 w-4" />
                      {formatTime(appointment.appointment_time)}
                    </div>
                    {appointment.duration_minutes && (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {appointment.duration_minutes} min
                      </span>
                    )}
                  </div>

                  {/* Appointment Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="font-medium text-slate-900 truncate">
                        {appointment.title || 'Untitled Appointment'}
                      </h3>
                      {getStatusBadge(appointment.status)}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
                      {appointment.client_name && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{appointment.client_name}</span>
                        </div>
                      )}

                      {appointment.lawyer_name && (
                        <div className="flex items-center gap-1">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-[8px] bg-slate-100">
                              {appointment.lawyer_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span>{appointment.lawyer_name}</span>
                        </div>
                      )}

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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
