import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { FilterState } from './types';
interface HearingsTimelineProps {
  filters: FilterState;
}
export const HearingsTimeline: React.FC<HearingsTimelineProps> = ({
  filters
}) => {
  const {
    data: hearings,
    isLoading
  } = useQuery({
    queryKey: ['hearings-timeline', filters],
    queryFn: async () => {
      let query = supabase.from('case_hearings').select(`
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
        query = query.gte('hearing_date', format(filters.dateRange.from, 'yyyy-MM-dd')).lte('hearing_date', format(filters.dateRange.to, 'yyyy-MM-dd'));
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
        query = query.or(`judge.ilike.%${filters.searchQuery}%,` + `purpose_of_hearing.ilike.%${filters.searchQuery}%,` + `cause_list_type.ilike.%${filters.searchQuery}%`);
      }
      const {
        data,
        error
      } = await query.order('hearing_date', {
        ascending: true
      });
      if (error) throw error;
      return data || [];
    }
  });
  if (isLoading) {
    return <div className="w-full text-center py-8">
        <div className="text-gray-600">Loading hearings...</div>
      </div>;
  }

  // Group hearings by date
  const groupedHearings = hearings?.reduce((groups, hearing) => {
    const date = hearing.hearing_date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(hearing);
    return groups;
  }, {} as Record<string, any[]>);
  return <div className="w-full space-y-6">
      {groupedHearings && Object.keys(groupedHearings).length > 0 ? Object.entries(groupedHearings).map(([date, dateHearings]) => <div key={date} className="flex w-full items-start gap-2">
            <div className="flex w-32 flex-none flex-col items-start gap-1 rounded-md bg-gray-50 px-6 py-6">
              <span className="text-lg font-semibold text-gray-900">
                {format(parseISO(date), 'EEEE')}
              </span>
              <span className="text-sm text-gray-600">
                {format(parseISO(date), 'MMM d, yyyy')}
              </span>
            </div>

            <div className="flex flex-1 flex-col items-start gap-2">
              {dateHearings.map(hearing => <div key={hearing.id} className="flex w-full items-center gap-4 rounded-md border border-gray-200 bg-white px-6 py-6 shadow-sm">
                  <div className="flex w-1 flex-none flex-col items-center gap-2 self-stretch overflow-hidden rounded-md bg-blue-600" />
                  
                  <div className="flex flex-1 flex-col items-start gap-4">
                    <div className="flex w-full items-start justify-between">
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">Scheduled</Badge>
                        </div>
                        <span className="text-lg font-semibold text-gray-900">
                          {hearing.cases?.case_title || 'Case title not available'}
                        </span>
                      </div>
                    </div>

                    <div className="flex w-full flex-wrap items-center gap-4">
                      {hearing.judge && <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Judge:</span>
                          <span className="text-sm text-gray-900">{hearing.judge}</span>
                        </div>}
                      
                      {hearing.purpose_of_hearing && <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Purpose:</span>
                          <span className="text-sm text-gray-900">{hearing.purpose_of_hearing}</span>
                        </div>}
                    </div>

                    {hearing.business_on_date && <div className="w-full p-3 bg-gray-50 rounded-lg">
                        
                      </div>}
                  </div>
                </div>)}
            </div>
          </div>) : <div className="w-full text-center py-12 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No hearings found</p>
          <p className="text-sm mt-2">Try adjusting your filters to see more results</p>
        </div>}
    </div>;
};