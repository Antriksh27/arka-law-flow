import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Plus, UserCheck } from 'lucide-react';
import { format, parseISO, isWithinInterval, subMinutes } from 'date-fns';
import BookAppointmentDialog from '@/components/reception/BookAppointmentDialog';
import EditAppointmentDialog from '@/components/reception/EditAppointmentDialog';
import RescheduleAppointmentDialog from '@/components/reception/RescheduleAppointmentDialog';
import { sendAppointmentNotification } from '@/lib/appointmentNotifications';

const ReceptionAppointments = () => {
  const { user, firmId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedLawyer, setSelectedLawyer] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [bookAppointmentOpen, setBookAppointmentOpen] = useState(false);
  const [editAppointmentOpen, setEditAppointmentOpen] = useState(false);
  const [rescheduleAppointmentOpen, setRescheduleAppointmentOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  // Check for action parameter to auto-open dialogs
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      setBookAppointmentOpen(true);
      // Clear the parameter
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Fetch lawyers for filter
  const { data: lawyers } = useQuery({
    queryKey: ['reception-lawyers', firmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, user_id, full_name, role')
        .eq('firm_id', firmId)
        .in('role', ['lawyer', 'admin', 'junior']);
      if (error) throw error;
      
      // Sort to always show "chitrajeet upadhyaya" first
      return data?.sort((a, b) => {
        const nameA = a.full_name?.toLowerCase() || '';
        const nameB = b.full_name?.toLowerCase() || '';
        
        if (nameA.includes('chitrajeet upadhyaya')) return -1;
        if (nameB.includes('chitrajeet upadhyaya')) return 1;
        return nameA.localeCompare(nameB);
      }) || [];
    },
    enabled: !!firmId
  });

  // Fetch appointments
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['reception-appointments', firmId, selectedLawyer, selectedDate],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select('*')
        .eq('firm_id', firmId)
        .eq('appointment_date', selectedDate)
        .order('appointment_time', { ascending: true });

      if (selectedLawyer !== 'all') {
        query = query.eq('lawyer_id', selectedLawyer);
      }

      const { data: appointmentsData, error } = await query;
      if (error) throw error;

      // Get client and lawyer names separately
      const enrichedAppointments = await Promise.all(
        (appointmentsData || []).map(async (appointment) => {
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
          } else if (appointment.title?.startsWith('Appointment with ')) {
            // If no client but title exists, try to find contact
            const extractedName = appointment.title.replace('Appointment with ', '');
            
            const { data: contactData } = await supabase
              .from('contacts')
              .select('name')
              .eq('firm_id', firmId)
              .ilike('name', `%${extractedName.trim()}%`)
              .limit(1);
            
            if (contactData && contactData.length > 0) {
              clientName = contactData[0].name;
            } else {
              clientName = extractedName;
            }
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
            client_name: clientName,
            lawyer_name: lawyerName
          };
        })
      );

      return enrichedAppointments;
    },
    enabled: !!firmId
  });

  // Mark arrived mutation
  const markArrivedMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      // Find the appointment to validate timing
      const appointment = appointments?.find(apt => apt.id === appointmentId);
      if (!appointment) throw new Error('Appointment not found');
      
      const appointmentDateTime = parseISO(`${appointment.appointment_date}T${appointment.appointment_time}`);
      const fifteenMinutesBefore = subMinutes(appointmentDateTime, 15);
      const fifteenMinutesAfter = new Date(appointmentDateTime.getTime() + 15 * 60 * 1000);
      const now = new Date();
      
      // Check if current time is within the allowed window (15 min before to 15 min after)
      if (now < fifteenMinutesBefore || now > fifteenMinutesAfter) {
        throw new Error('Can only mark as arrived within 15 minutes before and 15 minutes after scheduled time');
      }
      
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'arrived' })
        .eq('id', appointmentId);
      
      if (error) throw error;
    },
    onSuccess: async (_, appointmentId) => {
      queryClient.invalidateQueries({ queryKey: ['reception-appointments'] });
      
      // Send notification to lawyer about status change
      const appointment = appointments?.find(apt => apt.id === appointmentId);
      if (appointment?.lawyer_id) {
        try {
          await sendAppointmentNotification({
            type: 'status_changed',
            appointment_id: appointmentId,
            lawyer_id: appointment.lawyer_id,
            title: 'Client Arrived',
            message: `${appointment.client_name || 'Client'} has arrived for their appointment scheduled at ${appointment.appointment_time?.slice(0, 5) || 'N/A'}`,
            metadata: { 
              old_status: appointment.status,
              new_status: 'arrived',
              appointment_date: appointment.appointment_date,
              appointment_time: appointment.appointment_time
            }
          });
        } catch (error) {
          console.error('Failed to send arrival notification:', error);
        }
      }
      
      toast({
        title: "Success",
        description: "Client marked as arrived!",
      });
    },
    onError: (error) => {
      console.error('Error marking arrived:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to mark client as arrived. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mark late mutation
  const markLateMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'late' })
        .eq('id', appointmentId);
      
      if (error) throw error;
    },
    onSuccess: async (_, appointmentId) => {
      queryClient.invalidateQueries({ queryKey: ['reception-appointments'] });
      
      // Send notification to lawyer about status change
      const appointment = appointments?.find(apt => apt.id === appointmentId);
      if (appointment?.lawyer_id) {
        try {
          await sendAppointmentNotification({
            type: 'status_changed',
            appointment_id: appointmentId,
            lawyer_id: appointment.lawyer_id,
            title: 'Client Late',
            message: `${appointment.client_name || 'Client'} is marked as late for their appointment scheduled at ${appointment.appointment_time?.slice(0, 5) || 'N/A'}`,
            metadata: { 
              old_status: appointment.status,
              new_status: 'late',
              appointment_date: appointment.appointment_date,
              appointment_time: appointment.appointment_time
            }
          });
        } catch (error) {
          console.error('Failed to send late notification:', error);
        }
      }
    },
  });

  // Check for late appointments and update them
  React.useEffect(() => {
    if (!appointments) return;
    
    const now = new Date();
    appointments.forEach((appointment) => {
      // Only mark as late if status is upcoming or rescheduled
      if ((appointment.status === 'upcoming' || appointment.status === 'rescheduled') && appointment.appointment_date && appointment.appointment_time) {
        const appointmentDateTime = parseISO(`${appointment.appointment_date}T${appointment.appointment_time}`);
        // Mark as late if 15 minutes have passed after the scheduled time (end of arrival window)
        const fifteenMinutesAfter = new Date(appointmentDateTime.getTime() + 15 * 60 * 1000);
        
        if (now > fifteenMinutesAfter) {
          markLateMutation.mutate(appointment.id);
        }
      }
    });
  }, [appointments]); // Removed markLateMutation from dependencies to prevent infinite loop

  const shouldShowArrivedButton = (appointment: any) => {
    return appointment.status === 'upcoming' || appointment.status === 'late' || appointment.status === 'rescheduled';
  };

  const getArrivedButtonText = (appointment: any) => {
    if (!appointment.appointment_date || !appointment.appointment_time) return 'Mark Arrived';
    
    const appointmentDateTime = parseISO(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const fifteenMinutesAfter = new Date(appointmentDateTime.getTime() + 15 * 60 * 1000);
    const now = new Date();
    
    if (now > fifteenMinutesAfter) {
      return 'Too Late';
    } else {
      return 'Mark Arrived';
    }
  };

  const handleEdit = (appointment: any) => {
    setSelectedAppointment(appointment);
    setEditAppointmentOpen(true);
  };

  const handleReschedule = (appointment: any) => {
    setSelectedAppointment(appointment);
    setRescheduleAppointmentOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Upcoming</Badge>;
      case 'arrived':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Arrived</Badge>;
      case 'in-progress':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      case 'rescheduled':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Rescheduled</Badge>;
      case 'late':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Late</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Appointments</h1>
          <p className="text-[#6B7280] mt-1">Manage appointments for all lawyers</p>
        </div>
        <Button 
          className="gap-2"
          onClick={() => setBookAppointmentOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Book Appointment
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-[#111827] mb-2 block">Lawyer</label>
              <Select value={selectedLawyer} onValueChange={setSelectedLawyer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lawyer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lawyers</SelectItem>
                  {lawyers?.map((lawyer) => (
                    <SelectItem key={lawyer.user_id} value={lawyer.user_id}>
                      {lawyer.full_name} ({lawyer.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-[#111827] mb-2 block">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-[#111827]">
            Appointments for {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')} ({appointments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-[#6B7280]">Loading appointments...</div>
            </div>
          ) : appointments?.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
              <p className="text-[#6B7280]">No appointments scheduled</p>
              <p className="text-sm text-[#6B7280] mt-1">Book the first appointment for this day</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments?.map((appointment) => (
                <div key={appointment.id} className="border border-[#E5E7EB] rounded-lg p-4 hover:bg-[#F9FAFB] transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-[#6B7280]" />
                           <span className="font-medium text-[#111827]">
                             {appointment.appointment_time ? appointment.appointment_time.slice(0, 5) : 'Time not set'}
                           </span>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-[#6B7280]" />
                          <span className="text-sm text-[#6B7280]">Client:</span>
                          <span className="text-sm font-medium text-[#111827]">
                            {appointment.client_name || 'No client assigned'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-[#6B7280]" />
                          <span className="text-sm text-[#6B7280]">Lawyer:</span>
                          <span className="text-sm font-medium text-[#111827]">
                            {appointment.lawyer_name || 'No lawyer assigned'}
                          </span>
                        </div>

                        {appointment.title && (
                          <div className="text-sm text-[#6B7280]">
                            <strong>Title:</strong> {appointment.title}
                          </div>
                        )}

                        {appointment.notes && (
                          <div className="text-sm text-[#6B7280]">
                            <strong>Notes:</strong> {appointment.notes}
                          </div>
                        )}

                        {appointment.location && (
                          <div className="text-sm text-[#6B7280]">
                            <strong>Location:</strong> {appointment.location}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {shouldShowArrivedButton(appointment) && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => markArrivedMutation.mutate(appointment.id)}
                          disabled={markArrivedMutation.isPending}
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          {getArrivedButtonText(appointment)}
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(appointment)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleReschedule(appointment)}
                      >
                        Reschedule
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <BookAppointmentDialog 
        open={bookAppointmentOpen} 
        onOpenChange={setBookAppointmentOpen} 
      />
      
      <EditAppointmentDialog
        open={editAppointmentOpen}
        onOpenChange={setEditAppointmentOpen}
        appointment={selectedAppointment}
      />
      
      <RescheduleAppointmentDialog
        open={rescheduleAppointmentOpen}
        onOpenChange={setRescheduleAppointmentOpen}
        appointment={selectedAppointment}
      />
    </div>
  );
};

export default ReceptionAppointments;
