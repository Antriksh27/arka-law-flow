import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { FilterState } from './types';
import { Badge } from '@/components/ui/badge';

interface HearingsTableProps {
  filters: FilterState;
}

export const HearingsTable: React.FC<HearingsTableProps> = ({ filters }) => {
  const { data: hearings, isLoading } = useQuery({
    queryKey: ['hearings', filters],
    queryFn: async () => {
      let query = supabase
        .from('case_hearings')
        .select(`
          *,
          cases!inner(
            case_title,
            case_number,
            court_name,
            client_id,
            clients(full_name)
          )
        `);

      const today = format(new Date(), 'yyyy-MM-dd');
      query = query.gte('hearing_date', today);

      if (filters.dateRange.from && filters.dateRange.to) {
        query = query
          .gte('hearing_date', format(filters.dateRange.from, 'yyyy-MM-dd'))
          .lte('hearing_date', format(filters.dateRange.to, 'yyyy-MM-dd'));
      }

      if (filters.case && filters.case !== 'all') {
        query = query.eq('case_id', filters.case);
      }
      
      if (filters.court && filters.court !== 'all') {
        query = query.eq('cases.court_name', filters.court);
      }
      
      if (filters.clientId) {
        query = query.eq('cases.client_id', filters.clientId);
      }
      
      if (filters.searchQuery) {
        query = query.or(
          `judge.ilike.%${filters.searchQuery}%,` +
          `purpose_of_hearing.ilike.%${filters.searchQuery}%,` +
          `cause_list_type.ilike.%${filters.searchQuery}%`
        );
      }

      const { data, error } = await query.order('hearing_date', { ascending: true });
      if (error) throw error;
      return data || [];
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
              <th className="text-left py-3 px-4 font-medium text-gray-900">Case</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Judge</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Purpose</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Cause List Type</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
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
                    <div>
                      <div className="font-medium">{hearing.cases?.case_title}</div>
                      <div className="text-sm text-gray-500">{hearing.cases?.case_number}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{hearing.judge || '-'}</td>
                  <td className="py-3 px-4">
                    <div className="max-w-xs truncate">
                      {hearing.purpose_of_hearing || '-'}
                    </div>
                  </td>
                  <td className="py-3 px-4">{hearing.cause_list_type || '-'}</td>
                  <td className="py-3 px-4">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">Scheduled</Badge>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
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
