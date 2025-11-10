import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import TimeUtils from '@/lib/timeUtils';
import { FilterState } from './types';
import { Badge } from '@/components/ui/badge';
import { useVirtualizer } from '@tanstack/react-virtual';
import { defaultQueryConfig } from '@/lib/queryConfig';

interface HearingsTableProps {
  filters: FilterState;
}

export const HearingsTable: React.FC<HearingsTableProps> = ({ filters }) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  const { data: hearings = [], isLoading } = useQuery({
    queryKey: ['hearings', filters],
    queryFn: async () => {
      let query = supabase
        .from('case_hearings')
        .select(`
          *,
          cases!inner(
            case_title,
            case_number,
            registration_number,
            court_name,
            client_id,
            clients(full_name)
          )
        `);

      const today = TimeUtils.formatDateInput(TimeUtils.nowDate());
      query = query.gte('hearing_date', today);

      if (filters.dateRange.from && filters.dateRange.to) {
        query = query
          .gte('hearing_date', TimeUtils.formatDateInput(filters.dateRange.from))
          .lte('hearing_date', TimeUtils.formatDateInput(filters.dateRange.to));
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
    },
    ...defaultQueryConfig,
  });

  const virtualizer = useVirtualizer({
    count: hearings.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 60,
    overscan: 5,
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
      <div ref={tableContainerRef} className="overflow-auto max-h-[600px]">
        <table className="w-full">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Case</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Court</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Judge</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Purpose</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
            </tr>
          </thead>
          <tbody style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const hearing = hearings[virtualRow.index];
              if (!hearing) return null;
              
              return (
                <tr 
                  key={hearing.id} 
                  className="border-b border-gray-100 hover:bg-gray-50 absolute w-full"
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <td className="py-3 px-4">
                    {TimeUtils.formatDate(hearing.hearing_date, 'MMM d, yyyy')}
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{hearing.cases?.case_title}</div>
                      <div className="text-sm text-gray-500">{hearing.cases?.registration_number || 'Not registered'}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{hearing.cases?.court_name || '-'}</td>
                  <td className="py-3 px-4">{hearing.judge || '-'}</td>
                  <td className="py-3 px-4">
                    <div className="max-w-xs truncate">
                      {hearing.purpose_of_hearing || '-'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">Scheduled</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
