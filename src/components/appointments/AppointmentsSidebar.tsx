import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Clock, AlertCircle } from 'lucide-react';
import { IconButton } from '../messages/ui/IconButton';

export const AppointmentsSidebar: React.FC = () => {
  const { user } = useAuth();

  const { data: todayStats } = useQuery({
    queryKey: ['today-appointments-stats', user?.id],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      let query = supabase
        .from('appointment_details')
        .select('*')
        .eq('appointment_date', today);
      
      if (user?.id) {
        query = query.eq('lawyer_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const totalAppointments = data?.length || 0;
      const totalHours = data?.reduce((sum, apt) => sum + (apt.duration_minutes || 0), 0) || 0;
      const pendingAppointments = data?.filter(apt => apt.status === 'pending' || !apt.status).length || 0;

      return {
        totalAppointments,
        totalHours: Math.round(totalHours / 60 * 10) / 10, // Convert to hours with 1 decimal
        pendingAppointments
      };
    },
  });

  return (
    <div className="flex w-64 flex-none flex-col items-start gap-4">
      <div className="flex w-full flex-col items-start gap-2 rounded-lg border border-gray-200 bg-white px-6 py-6">
        <span className="text-lg font-semibold text-gray-900">
          Today's Overview
        </span>
        <div className="flex w-full flex-col items-start gap-2">
          <div className="flex w-full items-center gap-2 rounded-md bg-gray-50 px-4 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex flex-col items-start grow">
              <span className="text-sm font-semibold text-gray-900">
                {todayStats?.totalAppointments || 0} Appointments
              </span>
              <span className="text-xs text-gray-500">
                {todayStats?.totalHours || 0} hours total
              </span>
            </div>
          </div>
          {(todayStats?.pendingAppointments || 0) > 0 && (
            <div className="flex w-full items-center gap-2 rounded-md bg-yellow-50 px-4 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="flex flex-col items-start grow">
                <span className="text-sm font-semibold text-gray-900">
                  {todayStats?.pendingAppointments} Pending
                </span>
                <span className="text-xs text-gray-500">
                  Needs confirmation
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};