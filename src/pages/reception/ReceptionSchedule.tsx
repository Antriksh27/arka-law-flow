import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Calendar } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';

const ReceptionSchedule = () => {
  const { user, firmId } = useAuth();

  // Fetch today's appointments
  const { data: todayAppointments, isLoading } = useQuery({
    queryKey: ['reception-today-schedule', firmId],
    queryFn: async () => {
      const today = TimeUtils.formatDateInput(TimeUtils.nowDate());
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('firm_id', firmId)
        .eq('appointment_date', today)
        .order('appointment_time', { ascending: true });
      
      if (error) throw error;

      // Get client and lawyer names separately
      const enrichedAppointments = await Promise.all(
        (data || []).map(async (appointment) => {
          let clientName = null;
          let lawyerName = null;

          // Get client name if client_id exists
          if (appointment.client_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('full_name')
              .eq('id', appointment.client_id)
              .single();
            clientName = client?.full_name;
          }

          // Get lawyer name if lawyer_id exists
          if (appointment.lawyer_id) {
            const { data: lawyer } = await supabase
              .from('team_members')
              .select('full_name')
              .eq('user_id', appointment.lawyer_id)
              .single();
            lawyerName = lawyer?.full_name;
          }

          return {
            ...appointment,
            clients: clientName ? [{ full_name: clientName }] : [],
            profiles: lawyerName ? [{ full_name: lawyerName }] : []
          };
        })
      );

      return enrichedAppointments;
    },
    enabled: !!firmId
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Upcoming</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      case 'in-progress':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTimeStatus = (appointmentTime: string) => {
    if (!appointmentTime) return null;
    
    const now = new Date();
    const [hours, minutes] = appointmentTime.split(':').map(Number);
    const appointmentDateTime = new Date();
    appointmentDateTime.setHours(hours, minutes, 0, 0);
    
    const diffMinutes = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60);
    
    if (diffMinutes < -30) {
      return { status: 'past', label: 'Past', color: 'text-[#6B7280]' };
    } else if (diffMinutes < 0) {
      return { status: 'ongoing', label: 'Ongoing', color: 'text-yellow-600' };
    } else if (diffMinutes <= 30) {
      return { status: 'upcoming', label: 'Starting Soon', color: 'text-blue-600' };
    } else {
      return { status: 'future', label: 'Scheduled', color: 'text-[#6B7280]' };
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">Today's Schedule</h1>
        <p className="text-[#6B7280] mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-[#111827] flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Appointments ({todayAppointments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-[#6B7280]">Loading schedule...</div>
            </div>
          ) : todayAppointments?.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
              <p className="text-[#6B7280]">No appointments today</p>
              <p className="text-sm text-[#6B7280] mt-1">Enjoy your free day!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments?.map((appointment) => {
                const timeStatus = getTimeStatus(appointment.appointment_time);
                
                return (
                  <div 
                    key={appointment.id} 
                    className={`border rounded-lg p-4 transition-colors ${
                      timeStatus?.status === 'ongoing' 
                        ? 'border-yellow-200 bg-yellow-50' 
                        : timeStatus?.status === 'upcoming'
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-[#E5E7EB] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#6B7280]" />
                            <span className="font-medium text-[#111827]">
                              {appointment.appointment_time ? appointment.appointment_time.slice(0, 5) : 'Time not set'}
                            </span>
                          </div>
                          {timeStatus && (
                            <span className={`text-xs font-medium ${timeStatus.color}`}>
                              {timeStatus.label}
                            </span>
                          )}
                          {getStatusBadge(appointment.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-[#6B7280]" />
                            <span className="text-[#6B7280]">Client:</span>
                            <span className="font-medium text-[#111827]">
                              {appointment.clients?.[0]?.full_name || 'No client assigned'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-[#6B7280]" />
                            <span className="text-[#6B7280]">Lawyer:</span>
                            <span className="font-medium text-[#111827]">
                              {appointment.profiles?.[0]?.full_name || 'No lawyer assigned'}
                            </span>
                          </div>
                        </div>

                        {appointment.title && (
                          <div className="mt-2 text-sm">
                            <span className="text-[#6B7280]">Purpose: </span>
                            <span className="text-[#111827]">{appointment.title}</span>
                          </div>
                        )}

                        {appointment.location && (
                          <div className="mt-1 text-sm">
                            <span className="text-[#6B7280]">Location: </span>
                            <span className="text-[#111827]">{appointment.location}</span>
                          </div>
                        )}

                        {appointment.notes && (
                          <div className="mt-2 p-2 bg-[#F9FAFB] rounded text-sm text-[#6B7280]">
                            <strong>Notes:</strong> {appointment.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceptionSchedule;