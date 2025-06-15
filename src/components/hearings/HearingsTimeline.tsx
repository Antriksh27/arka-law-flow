import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, FileText, MoreVertical, Edit2, Trash } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { FilterState } from './types';
import { formatHearingType } from './utils';
import { useDialog } from '@/hooks/use-dialog';
import { EditHearingDialog } from './EditHearingDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

      // Always filter for today and after
      const today = format(new Date(), 'yyyy-MM-dd');
      query = query.gte('hearing_date', today);

      // Apply filters
      if (filters.dateRange.from && filters.dateRange.to) {
        query = query
          .gte('hearing_date', format(filters.dateRange.from, 'yyyy-MM-dd'))
          .lte('hearing_date', format(filters.dateRange.to, 'yyyy-MM-dd'));
      } else if (filters.dateRange.from) {
        query = query.gte('hearing_date', format(filters.dateRange.from, 'yyyy-MM-dd'));
      } else if (filters.dateRange.to) {
        query = query.lte('hearing_date', format(filters.dateRange.to, 'yyyy-MM-dd'));
      }

      if (filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.case && filters.case !== 'all' && filters.case.trim() !== '') {
        query = query.eq('case_id', filters.case);
      }
      if (filters.court && filters.court !== 'all' && filters.court.trim() !== '') {
        query = query.ilike('court_name', `%${filters.court}%`);
      }
      if (filters.assignedUser && filters.assignedUser !== 'all' && filters.assignedUser.trim() !== '') {
        query = query.eq('assigned_to', filters.assignedUser);
      }
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
      return data || [];
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
      case 'adjourned':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Adjourned</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><Clock className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><Clock className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><Clock className="w-3 h-3 mr-1" />{status}</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-600';
      case 'adjourned':
        return 'bg-yellow-600';
      case 'completed':
        return 'bg-green-600';
      case 'cancelled':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="w-full text-center py-8">
        <div className="text-gray-600">Loading hearings...</div>
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
    <div className="w-full space-y-6">
      {groupedHearings && Object.keys(groupedHearings).length > 0 ? (
        Object.entries(groupedHearings).map(([date, dateHearings]) => (
          <div key={date} className="flex w-full items-start gap-2">
            {/* Date sidebar */}
            <div className="flex w-32 flex-none flex-col items-start gap-1 rounded-md bg-gray-50 px-6 py-6">
              <span className="text-lg font-semibold text-gray-900">
                {format(parseISO(date), 'EEEE').split(',')[0]}
              </span>
              <span className="text-sm text-gray-600">
                {format(parseISO(date), 'MMM d, yyyy')}
              </span>
            </div>

            {/* Hearings for this date */}
            <div className="flex flex-1 flex-col items-start gap-2">
              {dateHearings.map((hearing) => (
                <div key={hearing.id} className="flex w-full items-center gap-4 rounded-md border border-gray-200 bg-white px-6 py-6 shadow-sm">
                  {/* Status indicator line */}
                  <div className={`flex w-1 flex-none flex-col items-center gap-2 self-stretch overflow-hidden rounded-md ${getStatusColor(hearing.status)}`} />
                  
                  {/* Hearing content */}
                  <div className="flex flex-1 flex-col items-start gap-4">
                    <div className="flex w-full items-start justify-between">
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {hearing.hearing_time || 'Time not set'}
                          </span>
                          {getStatusBadge(hearing.status)}
                        </div>
                        <span className="text-lg font-semibold text-gray-900">
                          {hearing.cases?.case_title || 'Case title not available'}
                        </span>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border-gray-200">
                          <DropdownMenuItem 
                            onClick={() => openDialog(<EditHearingDialog hearingId={hearing.id} />)}
                            className="cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit Hearing
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <FileText className="w-4 h-4 mr-2" />
                            Add Notes
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-red-600">
                            <Trash className="w-4 h-4 mr-2" />
                            Cancel Hearing
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Hearing details */}
                    <div className="flex w-full flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Court:</span>
                        <span className="text-sm text-gray-900">{hearing.court_name}</span>
                      </div>
                      
                      {hearing.bench && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Bench:</span>
                          <span className="text-sm text-gray-900">{hearing.bench}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Type:</span>
                        <span className="text-sm text-gray-900">{formatHearingType(hearing.hearing_type)}</span>
                      </div>
                    </div>

                    {/* Notes and outcome */}
                    {hearing.notes && (
                      <div className="w-full p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{hearing.notes}</p>
                      </div>
                    )}
                    
                    {hearing.outcome && (
                      <div className="w-full">
                        <p className="text-sm font-medium text-gray-900 mb-1">Outcome:</p>
                        <p className="text-sm text-gray-700">{hearing.outcome}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="w-full text-center py-12 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No hearings found</p>
          <p className="text-sm mt-2">Try adjusting your filters to see more results</p>
        </div>
      )}
    </div>
  );
};
