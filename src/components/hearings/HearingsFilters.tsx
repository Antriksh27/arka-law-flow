
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
  onFilterChange,
}) => {
  // Fetch unique courts for filter dropdown
  const { data: courts } = useQuery({
    queryKey: ['hearing-courts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hearings')
        .select('court_name')
        .not('court_name', 'is', null)
        .neq('court_name', '')
        .order('court_name');
      
      if (error) throw error;
      
      // Filter out any null, undefined, or empty string values and get unique values
      const uniqueCourts = [...new Set(
        (data || [])
          .map(item => item.court_name)
          .filter(court => court && court.trim() !== '')
      )];
      
      return uniqueCourts;
    }
  });

  // Fetch cases for filter dropdown
  const { data: cases } = useQuery({
    queryKey: ['hearing-cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title')
        .not('case_title', 'is', null)
        .neq('case_title', '')
        .order('case_title');
      
      if (error) throw error;
      
      // Filter out any null, undefined, or empty values
      return (data || []).filter(case_item => 
        case_item.id && 
        case_item.case_title && 
        case_item.case_title.trim() !== ''
      );
    }
  });

  // Fetch users for assigned filter
  const { data: users } = useQuery({
    queryKey: ['hearing-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .not('full_name', 'is', null)
        .neq('full_name', '')
        .order('full_name');
      
      if (error) throw error;
      
      // Filter out any null, undefined, or empty values
      return (data || []).filter(user => 
        user.id && 
        user.full_name && 
        user.full_name.trim() !== ''
      );
    }
  });

  const handleStatusChange = (status: HearingStatus, checked: boolean) => {
    const newStatuses = checked
      ? [...filters.status, status]
      : filters.status.filter(s => s !== status);
    
    onFilterChange({
      ...filters,
      status: newStatuses,
    });
  };

  const clearFilters = () => {
    onFilterChange({
      dateRange: { from: undefined, to: undefined },
      status: [],
      case: '',
      court: '',
      assignedUser: '',
      searchQuery: '',
    });
  };

  return (
    <div className="bg-white border border-gray-900 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search hearings..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({
              ...filters,
              searchQuery: e.target.value,
            })}
            className="bg-white border-gray-900 text-gray-900"
          />
        </div>

        {/* Date Range */}
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left bg-white border-gray-900 text-gray-900 hover:bg-gray-50">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange.from ? format(filters.dateRange.from, 'PPP') : 'From date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white border-gray-900">
              <Calendar
                mode="single"
                selected={filters.dateRange.from}
                onSelect={(date) => onFilterChange({
                  ...filters,
                  dateRange: { ...filters.dateRange, from: date },
                })}
                initialFocus
                className="bg-white"
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left bg-white border-gray-900 text-gray-900 hover:bg-gray-50">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange.to ? format(filters.dateRange.to, 'PPP') : 'To date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white border-gray-900">
              <Calendar
                mode="single"
                selected={filters.dateRange.to}
                onSelect={(date) => onFilterChange({
                  ...filters,
                  dateRange: { ...filters.dateRange, to: date },
                })}
                initialFocus
                className="bg-white"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Case Filter */}
        <Select
          value={filters.case}
          onValueChange={(value) => onFilterChange({
            ...filters,
            case: value,
          })}
        >
          <SelectTrigger className="w-[200px] bg-white border-gray-900 text-gray-900">
            <SelectValue placeholder="Select case" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-900">
            <SelectItem value="all" className="text-gray-900">All Cases</SelectItem>
            {cases?.map((case_item) => (
              <SelectItem key={case_item.id} value={case_item.id} className="text-gray-900">
                {case_item.case_title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Court Filter */}
        <Select
          value={filters.court}
          onValueChange={(value) => onFilterChange({
            ...filters,
            court: value,
          })}
        >
          <SelectTrigger className="w-[200px] bg-white border-gray-900 text-gray-900">
            <SelectValue placeholder="Select court" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-900">
            <SelectItem value="all" className="text-gray-900">All Courts</SelectItem>
            {courts?.map((court) => (
              <SelectItem key={court} value={court} className="text-gray-900">
                {court}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Assigned User Filter */}
        <Select
          value={filters.assignedUser}
          onValueChange={(value) => onFilterChange({
            ...filters,
            assignedUser: value,
          })}
        >
          <SelectTrigger className="w-[200px] bg-white border-gray-900 text-gray-900">
            <SelectValue placeholder="Assigned to" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-900">
            <SelectItem value="all" className="text-gray-900">All Users</SelectItem>
            {users?.map((user) => (
              <SelectItem key={user.id} value={user.id} className="text-gray-900">
                {user.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        <Button variant="outline" onClick={clearFilters} className="bg-white border-gray-900 text-gray-900 hover:bg-gray-50">
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>

      {/* Status Checkboxes */}
      <div className="flex gap-4">
        <span className="text-sm font-medium text-gray-900">Status:</span>
        {(['scheduled', 'adjourned', 'completed', 'cancelled'] as HearingStatus[]).map((status) => (
          <label key={status} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.status.includes(status)}
              onChange={(e) => handleStatusChange(status, e.target.checked)}
              className="rounded border-gray-900"
            />
            <span className="capitalize text-gray-900">{status}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
