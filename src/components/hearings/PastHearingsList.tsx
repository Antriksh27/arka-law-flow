import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { FilterState } from './types';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

interface PastHearingsListProps {
  filters: FilterState;
}

export const PastHearingsList: React.FC<PastHearingsListProps> = ({ filters }) => {
  const { data: hearings, isLoading } = useQuery({
    queryKey: ['past-hearings', filters],
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
      query = query.lt('hearing_date', today);

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

      const { data, error } = await query.order('hearing_date', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading past hearings...</div>
      </div>
    );
  }

  // Group by case
  const groupedByCaseId = hearings?.reduce((groups, hearing) => {
    const caseId = hearing.case_id;
    if (!groups[caseId]) {
      groups[caseId] = [];
    }
    groups[caseId].push(hearing);
    return groups;
  }, {} as Record<string, any[]>);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
      {groupedByCaseId && Object.keys(groupedByCaseId).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedByCaseId).map(([caseId, caseHearings]) => (
            <div key={caseId} className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {caseHearings[0].cases?.case_title}
              </h3>
              <div className="space-y-2">
                {caseHearings.map((hearing) => (
                  <div
                    key={hearing.id}
                    className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-none">
                      <Badge variant="outline" className="text-gray-600">
                        {format(parseISO(hearing.hearing_date), 'MMM d, yyyy')}
                      </Badge>
                    </div>
                    <div className="flex-1 space-y-1">
                      {hearing.judge && (
                        <p className="text-sm">
                          <span className="font-medium">Judge:</span> {hearing.judge}
                        </p>
                      )}
                      {hearing.purpose_of_hearing && (
                        <p className="text-sm">
                          <span className="font-medium">Purpose:</span> {hearing.purpose_of_hearing}
                        </p>
                      )}
                      {hearing.business_on_date && (
                        <p className="text-sm text-gray-600">{hearing.business_on_date}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No past hearings found</p>
          <p className="text-sm mt-2">Try adjusting your filters to see more results</p>
        </div>
      )}
    </div>
  );
};
