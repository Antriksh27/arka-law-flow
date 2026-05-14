import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import TimeUtils from '@/lib/timeUtils';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  UserCheck, 
  CheckCircle,
  AlertTriangle 
} from 'lucide-react';
import { format } from 'date-fns';

const ReceptionDisplayBoard = () => {
  const { firmId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's appointments with auto-refresh
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['display-board-appointments', firmId],
    queryFn: async () => {
      const today = TimeUtils.formatDateInput(TimeUtils.nowDate());
      // Phase 1 perf: explicit columns + single batch client lookup (no N+1)
      const { data, error } = await (supabase
        .from('appointments') as any)
        .select('id, client_id, title, status, appointment_date, appointment_time, daily_serial_number, lawyer_id, firm_id')
        .eq('firm_id', firmId)
        .eq('appointment_date', today)
        .in('status', ['upcoming', 'arrived', 'in-progress', 'late', 'rescheduled', 'completed'])
        .order('daily_serial_number', { ascending: true });

      if (error) throw error;

      const clientIds = Array.from(
        new Set((data || []).map((a: any) => a.client_id).filter(Boolean))
      ) as string[];

      let clientMap = new Map<string, string>();
      if (clientIds.length > 0) {
        const { data: clients } = await supabase
          .from('clients')
          .select('id, full_name')
          .in('id', clientIds);
        (clients || []).forEach((c: any) => clientMap.set(c.id, c.full_name));
      }

      return (data || []).map((appointment: any) => {
        let clientName: string | null = null;
        if (appointment.client_id) {
          clientName = clientMap.get(appointment.client_id) || null;
        } else if (appointment.title?.startsWith('Appointment with ')) {
          clientName = appointment.title.replace('Appointment with ', '');
        }
        return { ...appointment, client_name: clientName || 'Guest' };
      });
    },
    enabled: !!firmId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, 
  });

  // Mark arrived mutation with notification (shared logic from ReceptionAppointments)
  const markArrivedMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'arrived' })
        .eq('id', appointmentId);
      
      if (error) throw error;

      // Fetch fresh appointment data for notification
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (fetchError || !appointment) return;

      let clientName = 'A client';
      if (appointment.client_id) {
        const { data: client } = await supabase
          .from('clients')
          .select('full_name')
          .eq('id', appointment.client_id)
          .single();
        clientName = client?.full_name || 'A client';
      } else if (appointment.title?.startsWith('Appointment with ')) {
        clientName = appointment.title.replace('Appointment with ', '');
      }

      const lawyerIds: string[] = [];
      if (appointment.lawyer_id) lawyerIds.push(appointment.lawyer_id);

      if (lawyerIds.length > 0) {
        const timeFormatted = appointment.appointment_time?.slice(0, 5) || 'scheduled time';
        try {
          await supabase.functions.invoke('send-smart-notification', {
            body: {
              event_type: 'appointment',
              recipients: 'custom',
              recipient_ids: lawyerIds,
              reference_id: appointmentId,
              firm_id: appointment.firm_id,
              title: 'Client Has Arrived',
              message: `${clientName} has arrived for their ${timeFormatted} appointment`,
              category: 'appointment',
              priority: 'high',
              action_url: `/appointments?id=${appointmentId}`,
              metadata: {
                module: 'appointments',
                appointmentId: appointmentId,
                event: 'client_arrived',
                client_name: clientName,
                appointment_time: appointment.appointment_time,
                token_number: (appointment as any).daily_serial_number
              }
            }
          });
        } catch (notifError) {
          console.error('Failed to send arrival notification:', notifError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['display-board-appointments'] });
      toast({
        title: "Success",
        description: "Client marked as arrived! Lawyers have been notified.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark client as arrived.",
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['display-board-appointments'] });
      toast({
        title: "Marked as Late",
        description: "Client has been marked as late.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark client as late.",
        variant: "destructive",
      });
    },
  });

  // Mark completed mutation
  const markCompletedMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['display-board-appointments'] });
      toast({
        title: "Completed",
        description: "Appointment marked as completed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark as completed.",
        variant: "destructive",
      });
    },
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'upcoming':
        return { 
          bg: 'bg-blue-500', 
          text: 'text-white', 
          label: 'WAITING',
          icon: Clock
        };
      case 'arrived':
        return { 
          bg: 'bg-green-500', 
          text: 'text-white', 
          label: 'ARRIVED',
          icon: CheckCircle2
        };
      case 'in-progress':
        return { 
          bg: 'bg-yellow-500', 
          text: 'text-white', 
          label: 'IN PROGRESS',
          icon: Loader2
        };
      case 'late':
        return { 
          bg: 'bg-orange-500', 
          text: 'text-white', 
          label: 'LATE',
          icon: AlertCircle
        };
      case 'rescheduled':
        return { 
          bg: 'bg-purple-500', 
          text: 'text-white', 
          label: 'RESCHEDULED',
          icon: Clock
        };
      case 'completed':
        return { 
          bg: 'bg-gray-600', 
          text: 'text-gray-300', 
          label: 'COMPLETED',
          icon: CheckCircle
        };
      default:
        return { 
          bg: 'bg-gray-500', 
          text: 'text-white', 
          label: status.toUpperCase(),
          icon: Clock
        };
    }
  };

  // Count appointments by status
  const statusCounts = {
    waiting: appointments?.filter(a => a.status === 'upcoming').length || 0,
    arrived: appointments?.filter(a => a.status === 'arrived').length || 0,
    inProgress: appointments?.filter(a => a.status === 'in-progress').length || 0,
    late: appointments?.filter(a => a.status === 'late').length || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A8A] to-[#0F172A] text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Appointment Queue</h1>
          <p className="text-blue-200 text-xl mt-1">{format(currentTime, 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold font-mono">
            {format(currentTime, 'HH:mm')}
          </div>
          <div className="text-2xl text-blue-200 font-mono">
            {format(currentTime, 'ss')}
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
          <div className="text-4xl font-bold">{statusCounts.waiting}</div>
          <div className="text-blue-200 text-sm uppercase tracking-wide">Waiting</div>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
          <div className="text-4xl font-bold text-green-400">{statusCounts.arrived}</div>
          <div className="text-blue-200 text-sm uppercase tracking-wide">Arrived</div>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
          <div className="text-4xl font-bold text-yellow-400">{statusCounts.inProgress}</div>
          <div className="text-blue-200 text-sm uppercase tracking-wide">In Progress</div>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
          <div className="text-4xl font-bold text-orange-400">{statusCounts.late}</div>
          <div className="text-blue-200 text-sm uppercase tracking-wide">Late</div>
        </div>
      </div>

      {/* Appointment Queue */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-blue-300" />
        </div>
      ) : appointments?.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-20 h-20 text-blue-300 mx-auto mb-4 opacity-50" />
          <p className="text-2xl text-blue-200">No appointments scheduled for today</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments?.map((appointment, index) => {
            const statusConfig = getStatusConfig(appointment.status);
            const StatusIcon = statusConfig.icon;
            const tokenNumber = (appointment as any).daily_serial_number || index + 1;
            
            return (
              <div 
                key={appointment.id} 
                className={`rounded-2xl p-6 transition-all duration-300 ${
                  appointment.status === 'arrived' 
                    ? 'bg-green-600/30 border-2 border-green-400 animate-breathing' 
                    : appointment.status === 'in-progress'
                    ? 'bg-yellow-600/30 border-2 border-yellow-400 animate-breathing' 
                    : 'bg-white/10 backdrop-blur border border-white/20'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  {/* Token Number */}
                  <div className="bg-white text-[#1E3A8A] rounded-xl px-4 py-2">
                    <span className="text-sm font-medium">TOKEN</span>
                    <div className="text-3xl font-bold">#{tokenNumber}</div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className={`${statusConfig.bg} ${statusConfig.text} rounded-full px-4 py-2 flex items-center gap-2`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="text-sm font-bold">{statusConfig.label}</span>
                  </div>
                </div>

                {/* Client Name */}
                <div className="mb-3">
                  <div className="text-blue-200 text-sm">Client</div>
                  <div className="text-2xl font-semibold truncate">
                    {appointment.client_name}
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-2 text-blue-200">
                  <Clock className="w-5 h-5" />
                  <span className="text-xl font-medium">
                    {appointment.appointment_time?.slice(0, 5) || 'Time not set'}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-white/10">
                  {(appointment.status === 'upcoming' || appointment.status === 'late' || appointment.status === 'rescheduled') && (
                    <Button 
                      size="sm"
                      variant="outline"
                      className="bg-green-600/20 text-green-400 border-green-600/30 hover:bg-green-600 hover:text-white transition-all flex-1"
                      onClick={() => markArrivedMutation.mutate(appointment.id)}
                      disabled={markArrivedMutation.isPending}
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Arrived
                    </Button>
                  )}
                  
                  {(appointment.status === 'upcoming' || appointment.status === 'rescheduled') && (
                    <Button 
                      size="sm"
                      variant="outline"
                      className="bg-orange-600/20 text-orange-400 border-orange-600/30 hover:bg-orange-600 hover:text-white transition-all flex-1"
                      onClick={() => markLateMutation.mutate(appointment.id)}
                      disabled={markLateMutation.isPending}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Late
                    </Button>
                  )}

                  {(appointment.status === 'arrived' || appointment.status === 'in-progress') && (
                    <Button 
                      size="sm"
                      variant="outline"
                      className="bg-blue-600/20 text-blue-400 border-blue-600/30 hover:bg-blue-600 hover:text-white transition-all w-full"
                      onClick={() => markCompletedMutation.mutate(appointment.id)}
                      disabled={markCompletedMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur py-4 px-6">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="text-blue-200">
            Please wait for your token number to be called
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-blue-200 text-sm">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionDisplayBoard;
