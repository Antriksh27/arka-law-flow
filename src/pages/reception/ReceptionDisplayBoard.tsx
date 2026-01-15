import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import TimeUtils from '@/lib/timeUtils';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const ReceptionDisplayBoard = () => {
  const { firmId } = useAuth();
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
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('firm_id', firmId)
        .eq('appointment_date', today)
        .in('status', ['upcoming', 'arrived', 'in-progress', 'late', 'rescheduled'])
        .order('daily_serial_number', { ascending: true });
      
      if (error) throw error;

      // Get client names
      const enrichedAppointments = await Promise.all(
        (data || []).map(async (appointment) => {
          let clientName = null;

          if (appointment.client_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('full_name')
              .eq('id', appointment.client_id)
              .single();
            clientName = client?.full_name;
          } else if (appointment.title?.startsWith('Appointment with ')) {
            clientName = appointment.title.replace('Appointment with ', '');
          }

          return {
            ...appointment,
            client_name: clientName || 'Guest'
          };
        })
      );

      return enrichedAppointments;
    },
    enabled: !!firmId,
    refetchInterval: 5000 // Refresh every 5 seconds for real-time display
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
                    ? 'bg-green-600/30 border-2 border-green-400 animate-pulse' 
                    : appointment.status === 'in-progress'
                    ? 'bg-yellow-600/30 border-2 border-yellow-400'
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
