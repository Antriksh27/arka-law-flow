
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, MapPin, MoreVertical } from 'lucide-react';
import { FilterState, Hearing } from './types';
import { Button } from '@/components/ui/button';
import { useDialog } from '@/hooks/use-dialog';
import { EditHearingDialog } from './EditHearingDialog';
import { getHearingStatusBadge } from './utils';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface HearingsTableProps {
  filters: FilterState;
}

export const HearingsTable: React.FC<HearingsTableProps> = ({ filters }) => {
  const { openDialog } = useDialog();
  
  const { data: hearings, isLoading } = useQuery({
    queryKey: ['hearings', 'table', filters],
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

  // Function to delete a hearing
  const deleteHearing = async (id: string) => {
    const { error } = await supabase.from('hearings').delete().eq('id', id);
    
    if (error) {
      console.error("Error deleting hearing:", error);
      return;
    }
  };

  // Function to format the hearing type string
  const formatHearingType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead>Case</TableHead>
            <TableHead>Court</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hearings && hearings.length > 0 ? (
            hearings.map((hearing) => (
              <TableRow key={hearing.id}>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>
                      {format(parseISO(hearing.hearing_date), 'MMM d, yyyy')}
                      {hearing.hearing_time && (
                        <>
                          <span className="mx-1">·</span>
                          <Clock className="inline h-3.5 w-3.5 text-gray-500 mr-0.5" />
                          {hearing.hearing_time}
                        </>
                      )}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Link 
                    to={`/cases/${hearing.case_id}`}
                    className="font-medium hover:text-primary hover:underline"
                  >
                    {hearing.case_title || 'Unknown Case'}
                  </Link>
                  {hearing.client_name && (
                    <div className="text-xs text-gray-500">{hearing.client_name}</div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-500" />
                    <span>{hearing.court_name}</span>
                  </div>
                </TableCell>
                <TableCell>{formatHearingType(hearing.hearing_type)}</TableCell>
                <TableCell>{getHearingStatusBadge(hearing.status)}</TableCell>
                <TableCell>
                  <div className="max-w-[150px] truncate">
                    {hearing.outcome || '-'}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => openDialog(<EditHearingDialog hearingId={hearing.id} />)}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteHearing(hearing.id)}
                        className="text-red-600 hover:text-red-700 focus:text-red-700"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                No hearings found matching your filters
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
