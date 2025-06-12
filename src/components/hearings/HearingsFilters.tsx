
import React, { useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Search, CalendarIcon, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FilterState, HearingStatus } from './types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HearingsFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export const HearingsFilters: React.FC<HearingsFiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  // Fetch cases for dropdown
  const { data: cases } = useQuery({
    queryKey: ['cases-list-minimal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title')
        .order('case_title');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch courts for dropdown
  const { data: courts } = useQuery({
    queryKey: ['courts-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hearings')
        .select('court_name')
        .not('court_name', 'is', null)
        .order('court_name');
      
      if (error) throw error;
      
      // Get unique court names
      const uniqueCourts = [...new Set(data.map(item => item.court_name))];
      return uniqueCourts.map(court => ({ name: court }));
    },
  });

  // Fetch team members for assigned user filter
  const { data: teamMembers } = useQuery({
    queryKey: ['team-members-minimal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');
      
      if (error) throw error;
      return data || [];
    },
  });

  const handleStatusChange = (status: HearingStatus) => {
    if (filters.status.includes(status)) {
      onFilterChange({
        ...filters,
        status: filters.status.filter(s => s !== status),
      });
    } else {
      onFilterChange({
        ...filters,
        status: [...filters.status, status],
      });
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    onFilterChange({
      ...filters,
      dateRange: {
        from: range?.from,
        to: range?.to,
      },
    });
  };

  const handleReset = () => {
    onFilterChange({
      dateRange: { from: undefined, to: undefined },
      status: [],
      case: '',
      court: '',
      assignedUser: '',
      searchQuery: '',
    });
  };

  const hasFilters = filters.status.length > 0 || 
    filters.dateRange.from || filters.dateRange.to || 
    filters.case || filters.court || filters.assignedUser;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search cases, courts, or hearing types..."
            className="pl-10"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex gap-2 items-center">
                <CalendarIcon className="h-4 w-4" />
                <span>
                  {filters.dateRange.from ? (
                    filters.dateRange.to ? (
                      <>
                        {format(filters.dateRange.from, "MMM d, y")} -{" "}
                        {format(filters.dateRange.to, "MMM d, y")}
                      </>
                    ) : (
                      format(filters.dateRange.from, "MMM d, y")
                    )
                  ) : (
                    "Date Range"
                  )}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{
                  from: filters.dateRange.from,
                  to: filters.dateRange.to,
                }}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Select
            value={filters.case}
            onValueChange={(value) => onFilterChange({ ...filters, case: value })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Case" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Cases</SelectItem>
              {cases?.map(item => (
                <SelectItem key={item.id} value={item.id}>
                  {item.case_title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.court}
            onValueChange={(value) => onFilterChange({ ...filters, court: value })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Court" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Courts</SelectItem>
              {courts?.map((court, index) => (
                <SelectItem key={index} value={court.name}>
                  {court.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.assignedUser}
            onValueChange={(value) => onFilterChange({ ...filters, assignedUser: value })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Assigned To" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Users</SelectItem>
              {teamMembers?.map(member => (
                <SelectItem key={member.id} value={member.id}>
                  {member.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex gap-2 items-center">
                <Filter className="h-4 w-4" />
                Status
                {filters.status.length > 0 && (
                  <Badge variant="secondary" className="ml-1 rounded-full">
                    {filters.status.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-2 p-2">
                <div
                  className={`flex items-center px-2 py-1.5 rounded-md cursor-pointer ${
                    filters.status.includes("scheduled") ? "bg-blue-100" : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleStatusChange("scheduled")}
                >
                  <div className={`h-3 w-3 rounded-full bg-blue-500 mr-2`} />
                  <span>Scheduled</span>
                </div>
                <div
                  className={`flex items-center px-2 py-1.5 rounded-md cursor-pointer ${
                    filters.status.includes("adjourned") ? "bg-orange-100" : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleStatusChange("adjourned")}
                >
                  <div className={`h-3 w-3 rounded-full bg-orange-500 mr-2`} />
                  <span>Adjourned</span>
                </div>
                <div
                  className={`flex items-center px-2 py-1.5 rounded-md cursor-pointer ${
                    filters.status.includes("completed") ? "bg-green-100" : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleStatusChange("completed")}
                >
                  <div className={`h-3 w-3 rounded-full bg-green-500 mr-2`} />
                  <span>Completed</span>
                </div>
                <div
                  className={`flex items-center px-2 py-1.5 rounded-md cursor-pointer ${
                    filters.status.includes("cancelled") ? "bg-red-100" : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleStatusChange("cancelled")}
                >
                  <div className={`h-3 w-3 rounded-full bg-red-500 mr-2`} />
                  <span>Cancelled</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {hasFilters && (
            <Button variant="ghost" onClick={handleReset}>
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active filters */}
      {hasFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.status.map((status) => (
            <Badge
              key={status}
              variant="outline"
              className="rounded-full bg-gray-100 py-1.5 px-3"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => handleStatusChange(status)}
              />
            </Badge>
          ))}
          {filters.dateRange.from && (
            <Badge
              variant="outline"
              className="rounded-full bg-gray-100 py-1.5 px-3"
            >
              {format(filters.dateRange.from, "MMM d, y")}
              {filters.dateRange.to && ` - ${format(filters.dateRange.to, "MMM d, y")}`}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => handleDateRangeChange(undefined)}
              />
            </Badge>
          )}
          {filters.case && cases && (
            <Badge
              variant="outline"
              className="rounded-full bg-gray-100 py-1.5 px-3"
            >
              Case: {cases.find(c => c.id === filters.case)?.case_title}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => onFilterChange({ ...filters, case: '' })}
              />
            </Badge>
          )}
          {filters.court && (
            <Badge
              variant="outline"
              className="rounded-full bg-gray-100 py-1.5 px-3"
            >
              Court: {filters.court}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => onFilterChange({ ...filters, court: '' })}
              />
            </Badge>
          )}
          {filters.assignedUser && teamMembers && (
            <Badge
              variant="outline"
              className="rounded-full bg-gray-100 py-1.5 px-3"
            >
              Assigned to: {teamMembers.find(m => m.id === filters.assignedUser)?.full_name}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => onFilterChange({ ...filters, assignedUser: '' })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
