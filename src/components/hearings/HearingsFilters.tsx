import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { FilterState, HearingStatus } from './types';
interface HearingsFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}
export const HearingsFilters: React.FC<HearingsFiltersProps> = ({
  filters,
  onFilterChange
}) => {
  // Fetch unique courts for filter dropdown
  const {
    data: courts
  } = useQuery({
    queryKey: ['hearing-courts'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('cases').select('court_name').not('court_name', 'is', null).neq('court_name', '').order('court_name');
      if (error) throw error;

      // Filter out any null, undefined, or empty string values and get unique values
      const uniqueCourts = [...new Set((data || []).map(item => item.court_name).filter(court => court && court.trim() !== ''))];
      return uniqueCourts;
    }
  });

  // Fetch clients for filter dropdown
  const {
    data: clients
  } = useQuery({
    queryKey: ['hearing-clients'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('clients').select('id, full_name').not('full_name', 'is', null).neq('full_name', '').order('full_name');
      if (error) throw error;
      return (data || []).filter(client => client.id && client.full_name && client.full_name.trim() !== '');
    }
  });

  // Fetch cases for filter dropdown
  const {
    data: cases
  } = useQuery({
    queryKey: ['hearing-cases'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('cases').select('id, case_title').not('case_title', 'is', null).neq('case_title', '').order('case_title');
      if (error) throw error;

      // Filter out any null, undefined, or empty values
      return (data || []).filter(case_item => case_item.id && case_item.case_title && case_item.case_title.trim() !== '');
    }
  });

  // Fetch users for assigned filter
  const {
    data: users
  } = useQuery({
    queryKey: ['hearing-users'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('profiles').select('id, full_name').not('full_name', 'is', null).neq('full_name', '');
      if (error) throw error;

      // Filter out any null, undefined, or empty values
      const filteredData = (data || []).filter(user => user.id && user.full_name && user.full_name.trim() !== '');

      // Sort to always show "chitrajeet upadhyaya" first
      return filteredData.sort((a, b) => {
        const nameA = a.full_name?.toLowerCase() || '';
        const nameB = b.full_name?.toLowerCase() || '';
        if (nameA.includes('chitrajeet upadhyaya')) return -1;
        if (nameB.includes('chitrajeet upadhyaya')) return 1;
        return nameA.localeCompare(nameB);
      });
    }
  });
  const handleStatusChange = (status: HearingStatus, checked: boolean) => {
    const newStatuses = checked ? [...filters.status, status] : filters.status.filter(s => s !== status);
    onFilterChange({
      ...filters,
      status: newStatuses
    });
  };
  const clearFilters = () => {
    onFilterChange({
      dateRange: {
        from: undefined,
        to: undefined
      },
      status: [],
      case: '',
      court: '',
      assignedUser: '',
      searchQuery: '',
      clientId: undefined
    });
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search hearings..."
          value={filters.searchQuery}
          onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
          className="max-w-xs"
        />
        
        <Select
          value={filters.case}
          onValueChange={(value) => onFilterChange({ ...filters, case: value })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by case" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cases</SelectItem>
            {cases?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.case_title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.court}
          onValueChange={(value) => onFilterChange({ ...filters, court: value })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by court" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All courts</SelectItem>
            {courts?.map((court) => (
              <SelectItem key={court} value={court}>
                {court}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={clearFilters}>
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      </div>
    </div>
  );
};