import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Plus, Clock, MapPin, FileText, User } from 'lucide-react';
import { useDialog } from '@/hooks/use-dialog';
import { CreateAppointmentDialog } from '@/components/appointments/CreateAppointmentDialog';
import { format } from 'date-fns';

interface ClientAppointmentsProps {
  clientId: string;
}

interface AppointmentWithDetails {
  id: string;
  title: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  start_time: string | null;
  status: string;
  type: string;
  duration_minutes: number;
  location: string | null;
  notes: string | null;
  lawyer: {
    full_name: string;
  } | null;
  case: {
    case_title: string;
    case_number: string;
  } | null;
}

export const ClientAppointments: React.FC<ClientAppointmentsProps> = ({ clientId }) => {
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['client-appointments', clientId],
    queryFn: async (): Promise<AppointmentWithDetails[]> => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          title,
          appointment_date,
          appointment_time,
          start_time,
          status,
          type,
          duration_minutes,
          location,
          notes,
          lawyer_id,
          case_id,
          team_members!appointments_lawyer_id_fkey(full_name),
          cases(case_title, case_number)
        `)
        .eq('client_id', clientId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      return (data || []).map(appointment => ({
        id: appointment.id,
        title: appointment.title,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        start_time: appointment.start_time,
        status: appointment.status,
        type: appointment.type,
        duration_minutes: appointment.duration_minutes,
        location: appointment.location,
        notes: appointment.notes,
        lawyer: Array.isArray(appointment.team_members) && appointment.team_members.length > 0 
          ? appointment.team_members[0] 
          : appointment.team_members && !Array.isArray(appointment.team_members)
          ? appointment.team_members
          : null,
        case: Array.isArray(appointment.cases) && appointment.cases.length > 0 
          ? appointment.cases[0] 
          : appointment.cases && !Array.isArray(appointment.cases)
          ? appointment.cases
          : null
      }));
    }
  });

  const { openDialog } = useDialog();

  // Separate upcoming and past appointments
  const now = new Date();
  const upcomingAppointments = appointments.filter(apt => {
    if (apt.appointment_date) {
      const aptDate = new Date(apt.appointment_date);
      return aptDate >= now || apt.status === 'upcoming';
    }
    return false;
  });
  
  const pastAppointments = appointments.filter(apt => {
    if (apt.appointment_date) {
      const aptDate = new Date(apt.appointment_date);
      return aptDate < now && apt.status !== 'upcoming';
    }
    return false;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video-call':
        return '📹';
      case 'call':
        return '📞';
      case 'in-person':
        return '👤';
      default:
        return '📅';
    }
  };

  const renderAppointmentCard = (appointment: AppointmentWithDetails) => (
    <div 
      key={appointment.id} 
      className="border border-border rounded-xl p-5 hover:shadow-md transition-shadow bg-card"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{getTypeIcon(appointment.type)}</span>
            <h4 className="font-semibold text-foreground text-base">
              {appointment.title || `${appointment.type} Appointment`}
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(appointment.status)}>
              {appointment.status}
            </Badge>
            <span className="text-sm text-muted-foreground capitalize">{appointment.type}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {appointment.appointment_date && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {format(new Date(appointment.appointment_date), 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
        )}
        
        {appointment.appointment_time && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>
              {appointment.appointment_time} • {appointment.duration_minutes} minutes
            </span>
          </div>
        )}

        {appointment.lawyer && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-4 h-4" />
            <span>With {appointment.lawyer.full_name}</span>
          </div>
        )}

        {appointment.case && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>
              {appointment.case.case_title} ({appointment.case.case_number})
            </span>
          </div>
        )}

        {appointment.location && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{appointment.location}</span>
          </div>
        )}

        {appointment.notes && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-sm text-muted-foreground">{appointment.notes}</p>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card className="bg-card rounded-2xl shadow-sm border-border">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading appointments...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card rounded-2xl shadow-sm border-border">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border">
        <div>
          <CardTitle className="text-xl font-semibold text-foreground">Appointments</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {upcomingAppointments.length} upcoming • {pastAppointments.length} past
          </p>
        </div>
        <Button 
          size="sm" 
          className="bg-primary hover:bg-primary/90" 
          onClick={() => openDialog(<CreateAppointmentDialog preSelectedClientId={clientId} />)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        {appointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No appointments scheduled for this client</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => openDialog(<CreateAppointmentDialog preSelectedClientId={clientId} />)}
            >
              Schedule First Appointment
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Appointments */}
            {upcomingAppointments.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    Upcoming Appointments ({upcomingAppointments.length})
                  </h3>
                </div>
                <div className="space-y-4">
                  {upcomingAppointments.map(renderAppointmentCard)}
                </div>
              </div>
            )}

            {/* Past Appointments */}
            {pastAppointments.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    Past Appointments ({pastAppointments.length})
                  </h3>
                </div>
                <div className="space-y-4">
                  {pastAppointments.map(renderAppointmentCard)}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
