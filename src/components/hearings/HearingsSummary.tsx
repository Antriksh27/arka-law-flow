import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, AlertCircle, XCircle, TrendingUp } from 'lucide-react';
import { format, addDays } from 'date-fns';

export const HearingsSummary: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['hearings-summary'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const next7Days = format(addDays(new Date(), 7), 'yyyy-MM-dd');

      // Get all hearings in the next 7 days
      const { data: upcomingHearings } = await supabase
        .from('hearings')
        .select('status')
        .gte('hearing_date', today)
        .lte('hearing_date', next7Days);

      const total = upcomingHearings?.length || 0;
      const adjourned = upcomingHearings?.filter(h => h.status === 'adjourned').length || 0;
      const cancelled = upcomingHearings?.filter(h => h.status === 'cancelled').length || 0;
      const scheduled = upcomingHearings?.filter(h => h.status === 'scheduled').length || 0;

      return { total, adjourned, cancelled, scheduled };
    }
  });

  if (isLoading || !stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-[#6B7280]">Next 7 Days</div>
            <div className="text-2xl font-semibold text-[#111827] mt-1">{stats.total}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#E0E7FF] flex items-center justify-center">
            <Calendar className="w-6 h-6 text-[#1E3A8A]" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-[#6B7280]">Scheduled</div>
            <div className="text-2xl font-semibold text-[#10B981] mt-1">{stats.scheduled}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#D1FAE5] flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-[#10B981]" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-[#6B7280]">Adjourned</div>
            <div className="text-2xl font-semibold text-[#F59E0B] mt-1">{stats.adjourned}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-[#F59E0B]" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-[#6B7280]">Cancelled</div>
            <div className="text-2xl font-semibold text-[#EF4444] mt-1">{stats.cancelled}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] flex items-center justify-center">
            <XCircle className="w-6 h-6 text-[#EF4444]" />
          </div>
        </div>
      </div>
    </div>
  );
};
