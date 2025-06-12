
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, compareAsc } from 'date-fns';
import { Calendar, Clock, MapPin, Edit, Trash2 } from 'lucide-react';
import { FilterState, Hearing } from './types';
import { Button } from '@/components/ui/button';
import { useDialog } from '@/hooks/use-dialog';
import { EditHearingDialog } from './EditHearingDialog';
import { getHearingStatusBadge, canEditHearing } from './utils';
import { Link } from 'react-router-dom';

interface HearingsTimelineProps {
  filters: FilterState;
}

export const HearingsTimeline: React.FC<HearingsTimelineProps> = ({ filters }) => {
  const { openDialog } = useDialog();
  
  const { data: hearings, isLoading } = useQuery({
    queryKey: ['hearings', 'timeline', filters],
    queryFn: async () => {
      // Build query
      let query = supabase
        .from('hearing_details')
        .select('*')
        .order('hearing_date', { ascending: true });

      // Apply filters
      if (filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.case) {
        query = query.eq('case_id', filters.case);
      }

      if (filters.court) {
        query = query.eq('court_name', filters.court);
      }

      if (filters.assignedUser) {
        query = query.eq('assigned_to', filters.assignedUser);
      }

      if (filters.dateRange.from) {
        query = query.gte('hearing_date', format(filters.dateRange.from, 'yyyy-MM-dd'));
      }

      if (filters.dateRange.to) {
        query = query.lte('hearing_date', format(filters.dateRange.to, 'yyyy-MM-dd'));
      }

      if (filters.searchQuery) {
        query = query.or(`case_title.ilike.%${filters.searchQuery}%,court_name.ilike.%${filters.searchQuery}%,hearing_type.ilike.%${filters.searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Hearing[];
    },
  });

  // Group hearings by date
  const groupedHearings = React.useMemo(() => {
    if (!hearings) return {};
    
    const grouped: Record<string, Hearing[]> = {};
    hearings.forEach(hearing => {
      const dateKey = hearing.hearing_date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(hearing);
    });
    
    // Sort hearings within each date by time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        if (a.hearing_time && b.hearing_time) {
          return a.hearing_time.localeCompare(b.hearing_time);
        }
        return 0;
      });
    });
    
    return grouped;
  }, [hearings]);

  // Get sorted date keys
  const sortedDateKeys = React.useMemo(() => {
    return Object.keys(groupedHearings).sort((a, b) => 
      compareAsc(parseISO(a), parseISO(b))
    );
  }, [groupedHearings]);

  // Function to format the hearing type string
  const formatHearingType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Function to delete a hearing
  const deleteHearing = async (id: string) => {
    const { error } = await supabase.from('hearings').delete().eq('id', id);
    
    if (error) {
      console.error("Error deleting hearing:", error);
      return;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (sortedDateKeys.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <Calendar className="h-8 w-8 text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No hearings found</h3>
        <p className="text-gray-500">Try adjusting your filters or add a new hearing</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {sortedDateKeys.map((dateKey) => {
        const dateHearings = groupedHearings[dateKey];
        const formattedDate = format(parseISO(dateKey), 'EEEE, MMMM d, yyyy');
        
        return (
          <div key={dateKey} className="border-b border-gray-200 last:border-b-0">
            <div className="sticky top-0 bg-gray-50 px-6 py-3">
              <div className="flex items-center">
                <Calendar className="text-primary h-5 w-5 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">{formattedDate}</h3>
              </div>
            </div>
            
            <div className="pl-8">
              {dateHearings.map((hearing) => (
                <div 
                  key={hearing.id}
                  className="relative border-l-2 border-gray-200 pl-6 py-5 ml-4 hover:bg-gray-50"
                >
                  {/* Timeline dot */}
                  <div 
                    className="absolute -left-[9px] top-6 w-4 h-4 rounded-full border-4 border-white"
                    style={{
                      backgroundColor: 
                        hearing.status === 'completed' ? '#22c55e' :
                        hearing.status === 'adjourned' ? '#f97316' : 
                        hearing.status === 'cancelled' ? '#ef4444' : '#3b82f6'
                    }}
                  />
                  
                  {/* Hearing card */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:border-gray-300">
                    <div className="px-5 py-4">
                      <div className="flex justify-between">
                        <div>
                          <div className="flex items-center mb-1">
                            {hearing.hearing_time && (
                              <div className="flex items-center text-sm font-medium text-gray-900 mr-3">
                                <Clock className="h-3.5 w-3.5 mr-1 text-gray-500" />
                                {hearing.hearing_time}
                              </div>
                            )}
                            
                            {getHearingStatusBadge(hearing.status)}
                            
                            <span className="mx-2 text-gray-300">|</span>
                            
                            <span className="text-sm font-medium text-gray-700">
                              {formatHearingType(hearing.hearing_type)}
                            </span>
                          </div>
                          
                          <Link 
                            to={`/cases/${hearing.case_id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-primary hover:underline"
                          >
                            {hearing.case_title || 'Unknown Case'}
                          </Link>
                          
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <MapPin className="h-3.5 w-3.5 mr-1 text-gray-500" />
                            {hearing.court_name}
                            
                            {hearing.coram && (
                              <>
                                <span className="mx-2 text-gray-300">|</span>
                                <span>Coram: {hearing.coram}</span>
                              </>
                            )}
                            
                            {hearing.bench && (
                              <>
                                <span className="mx-2 text-gray-300">|</span>
                                <span>Bench: {hearing.bench}</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-1">
                          {canEditHearing() && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openDialog(<EditHearingDialog hearingId={hearing.id} />)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => deleteHearing(hearing.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Outcome if available */}
                      {hearing.outcome && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Outcome:</h4>
                          <p className="text-sm text-gray-600">{hearing.outcome}</p>
                        </div>
                      )}
                      
                      {/* Notes if available */}
                      {hearing.notes && (
                        <div className={`mt-3 ${!hearing.outcome ? 'pt-3 border-t border-gray-100' : ''}`}>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Notes:</h4>
                          <p className="text-sm text-gray-600">{hearing.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
