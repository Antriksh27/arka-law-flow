import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Plus, Clock } from 'lucide-react';

interface ClientAppointmentsProps {
  clientId: string;
}

interface AppointmentWithLawyer {
  id: string;
  start_time: string;
  status: string;
  type: string;
  duration_minutes: number;
  lawyer: {
    full_name: string;
  } | null;
}

export const ClientAppointments: React.FC<ClientAppointmentsProps> = ({ clientId }) => {
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['client-appointments', clientId],
    queryFn: async (): Promise<AppointmentWithLawyer[]> => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          status,
          type,
          duration_minutes,
          lawyer_id,
          profiles!appointments_lawyer_id_fkey(full_name)
        `)
        .eq('client_id', clientId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      return (data || []).map(appointment => ({
        id: appointment.id,
        start_time: appointment.start_time,
        status: appointment.status,
        type: appointment.type,
        duration_minutes: appointment.duration_minutes,
        lawyer: Array.isArray(appointment.profiles) && appointment.profiles.length > 0 
          ? appointment.profiles[0] 
          : appointment.profiles && !Array.isArray(appointment.profiles)
          ? appointment.profiles
          : null
      }));
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading appointments...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Appointments</CardTitle>
        <Button size="sm" className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Schedule
        </Button>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No appointments scheduled for this client
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {new Date(appointment.start_time).toLocaleDateString()}
                      </span>
                      <Clock className="w-4 h-4 text-gray-400 ml-2" />
                      <span className="text-gray-600">
                        {new Date(appointment.start_time).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <Badge 
                        variant="secondary" 
                        className={getStatusColor(appointment.status)}
                      >
                        {appointment.status}
                      </Badge>
                      <span>Type: {appointment.type}</span>
                      {appointment.lawyer && (
                        <span>With: {appointment.lawyer.full_name}</span>
                      )}
                      <span>Duration: {appointment.duration_minutes} min</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
