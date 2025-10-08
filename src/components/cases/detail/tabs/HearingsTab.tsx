import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fetchLegalkartCaseId } from '../../legalkart/utils';
import { Badge } from '@/components/ui/badge';

interface HearingsTabProps {
  caseId: string;
}

export const HearingsTab: React.FC<HearingsTabProps> = ({ caseId }) => {
  const { data: hearings, isLoading } = useQuery({
    queryKey: ['case-hearings-api', caseId],
    queryFn: async () => {
      const lkCaseId = await fetchLegalkartCaseId(caseId);
      if (!lkCaseId) return [];

      const { data, error } = await supabase
        .from('legalkart_history' as any)
        .select('*')
        .eq('legalkart_case_id', lkCaseId)
        .order('hearing_date', { ascending: false });

      if (error) throw error;
      return (data || []) as any[];
    }
  });

  if (isLoading) {
    return <div className="text-center py-8 text-[#6B7280]">Loading hearings...</div>;
  }

  if (!hearings || hearings.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
        <p className="text-[#6B7280]">No hearings available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                Hearing Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                Business
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                Purpose
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                Judicial Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {hearings.map((hearing) => (
              <tr key={hearing.id} className="hover:bg-[#F9FAFB]">
                <td className="px-6 py-4">
                  {hearing.hearing_date ? (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-[#1E3A8A] mr-2" />
                      <span className="text-sm font-medium text-[#111827]">
                        {format(new Date(hearing.hearing_date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  ) : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-[#6B7280]">
                  {hearing.business_on_date || '-'}
                </td>
                <td className="px-6 py-4">
                  {hearing.purpose_of_hearing ? (
                    <Badge variant="outline">{hearing.purpose_of_hearing}</Badge>
                  ) : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-[#6B7280]">
                  {hearing.judicial_action_on_date || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
