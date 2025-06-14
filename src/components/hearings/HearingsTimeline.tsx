
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Edit } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { FilterState } from './types';
import { getHearingStatusBadge, formatHearingType } from './utils';
import { useDialog } from '@/hooks/use-dialog';
import { EditHearingDialog } from './EditHearingDialog';

interface HearingsTimelineProps {
  filters: FilterState;
}

export const HearingsTimeline: React.FC<HearingsTimelineProps> = ({ filters }) => {
  const { openDialog } = useDialog();

  const { data: hearings, isLoading } = useQuery({
    queryKey: ['hearings-timeline', filters],
    queryFn: async () => {
      let query = supabase
        .from('hearings')
        .select(`
          *,
          cases!hearings_case_id_fkey(case_title, case_number)
        `);

      // Apply date range filter only if both dates are provided
      if (filters.dateRange.from && filters.dateRange.to) {
        query = query
          .gte('hearing_date', format(filters.dateRange.from, 'yyyy-MM-dd'))
          .lte('hearing_date', format(filters.dateRange.to, 'yyyy-MM-dd'));
      } else if (filters.dateRange.from) {
        query = query.gte('hearing_date', format(filters.dateRange.from, 'yyyy-MM-dd'));
      } else if (filters.dateRange.to) {
        query = query.lte('hearing_date', format(filters.dateRange.to, 'yyyy-MM-dd'));
      }

      // Apply status filter only if there are selected statuses
      if (filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      // Apply case filter only if a specific case is selected
      if (filters.case && filters.case !== 'all' && filters.case.trim() !== '') {
        query = query.eq('case_id', filters.case);
      }

      // Apply court filter only if a specific court is selected
      if (filters.court && filters.court !== 'all' && filters.court.trim() !== '') {
        query = query.ilike('court_name', `%${filters.court}%`);
      }

      // Apply assigned user filter only if a specific user is selected
      if (filters.assignedUser && filters.assignedUser !== 'all' && filters.assignedUser.trim() !== '') {
        query = query.eq('assigned_to', filters.assignedUser);
      }

      // Apply search query filter only if there's a search term
      if (filters.searchQuery && filters.searchQuery.trim() !== '') {
        query = query.or(
          `court_name.ilike.%${filters.searchQuery}%,` +
          `hearing_type.ilike.%${filters.searchQuery}%,` +
          `notes.ilike.%${filters.searchQuery}%`
        );
      }

      const { data, error } = await query.order('hearing_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching hearings:', error);
        throw error;
      }
      
      console.log('Fetched hearings:', data);
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

  // Group hearings by date
  const groupedHearings = hearings?.reduce((groups, hearing) => {
    const date = hearing.hearing_date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(hearing);
    return groups;
  }, {} as Record<string, any[]>);

  return (
    <div className="p-6">
      {groupedHearings && Object.keys(groupedHearings).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedHearings).map(([date, dateHearings]) => (
            <div key={date} className="relative">
              {/* Date header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Hearings for this date */}
              <div className="space-y-4 ml-4">
                {dateHearings.map((hearing, index) => (
                  <div key={hearing.id} className="relative">
                    {/* Timeline connector */}
                    <div className="absolute left-[-20px] top-4 w-2 h-2 bg-blue-600 rounded-full"></div>
                    {index < dateHearings.length - 1 && (
                      <div className="absolute left-[-16px] top-6 w-px h-full bg-gray-200"></div>
                    )}

                    {/* Hearing card */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {formatHearingType(hearing.hearing_type)}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              {hearing.hearing_time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {hearing.hearing_time}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {hearing.court_name}
                              </div>
                            </div>
                          </div>
                        </div>
                        {getHearingStatusBadge(hearing.status)}
                      </div>

                      {/* Case info */}
                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-900">
                          {hearing.cases?.case_title}
                        </div>
                        {hearing.cases?.case_number && (
                          <div className="text-sm text-gray-500">
                            {hearing.cases.case_number}
                          </div>
                        )}
                      </div>

                      {/* Additional details */}
                      {(hearing.bench || hearing.coram) && (
                        <div className="mb-3 text-sm text-gray-600">
                          {hearing.bench && <div>Bench: {hearing.bench}</div>}
                          {hearing.coram && <div>Coram: {hearing.coram}</div>}
                        </div>
                      )}

                      {/* Notes */}
                      {hearing.notes && (
                        <div className="mb-3 p-3 bg-white rounded-lg">
                          <p className="text-sm text-gray-700">{hearing.notes}</p>
                        </div>
                      )}

                      {/* Outcome */}
                      {hearing.outcome && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-900">Outcome:</p>
                          <p className="text-sm text-gray-700">{hearing.outcome}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-end pt-3 border-t border-gray-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            openDialog(<EditHearingDialog hearingId={hearing.id} />);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
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
          <p>No hearings found</p>
          <p className="text-sm mt-2">Try adjusting your filters to see more results</p>
        </div>
      )}
    </div>
  );
};
