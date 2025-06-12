
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { Edit, Eye } from 'lucide-react';
import { FilterState, Hearing } from './types';
import { getHearingStatusBadge, formatHearingType } from './utils';
import { useDialog } from '@/hooks/use-dialog';
import { EditHearingDialog } from './EditHearingDialog';

interface HearingsTableProps {
  filters: FilterState;
}

export const HearingsTable: React.FC<HearingsTableProps> = ({ filters }) => {
  const { openDialog } = useDialog();

  const { data: hearings, isLoading } = useQuery({
    queryKey: ['hearings', filters],
    queryFn: async () => {
      let query = supabase
        .from('hearings')
        .select(`
          *,
          cases!hearings_case_id_fkey(case_title, case_number),
          profiles!hearings_created_by_fkey(full_name)
        `);

      // Apply filters
      if (filters.dateRange.from && filters.dateRange.to) {
        query = query
          .gte('hearing_date', format(filters.dateRange.from, 'yyyy-MM-dd'))
          .lte('hearing_date', format(filters.dateRange.to, 'yyyy-MM-dd'));
      }

      if (filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.court) {
        query = query.ilike('court_name', `%${filters.court}%`);
      }

      if (filters.searchQuery) {
        query = query.or(
          `court_name.ilike.%${filters.searchQuery}%,` +
          `hearing_type.ilike.%${filters.searchQuery}%,` +
          `cases.case_title.ilike.%${filters.searchQuery}%`
        );
      }

      const { data, error } = await query.order('hearing_date', { ascending: true });
      
      if (error) throw error;
      return (data || []) as Hearing[];
    }
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading hearings...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Time</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Case</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Court</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Outcome</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {hearings && hearings.length > 0 ? (
              hearings.map((hearing) => (
                <tr key={hearing.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    {format(parseISO(hearing.hearing_date), 'MMM d, yyyy')}
                  </td>
                  <td className="py-3 px-4">
                    {hearing.hearing_time || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{hearing.case_title}</div>
                      <div className="text-sm text-gray-500">{hearing.case_number}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{hearing.court_name}</td>
                  <td className="py-3 px-4">{formatHearingType(hearing.hearing_type)}</td>
                  <td className="py-3 px-4">
                    {getHearingStatusBadge(hearing.status)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="max-w-xs truncate">
                      {hearing.outcome || '-'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          openDialog(<EditHearingDialog hearingId={hearing.id} />);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500">
                  No hearings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
