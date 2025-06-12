
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, Search, X } from 'lucide-react';
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
  
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFilterChange({ ...filters, [key]: value });
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

  const hasActiveFilters = 
    filters.dateRange.from || 
    filters.dateRange.to || 
    filters.status.length > 0 || 
    filters.case || 
    filters.court || 
    filters.assignedUser || 
    filters.searchQuery;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Search</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search hearings..."
              value={filters.searchQuery}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Date Range</label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {filters.dateRange.from ? format(filters.dateRange.from, 'MMM d') : 'From'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.from}
                  onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, from: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {filters.dateRange.to ? format(filters.dateRange.to, 'MMM d') : 'To'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.to}
                  onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, to: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Status</label>
          <Select
            value={filters.status.length === 1 ? filters.status[0] : ''}
            onValueChange={(value: HearingStatus) => {
              if (value) {
                updateFilter('status', [value]);
              } else {
                updateFilter('status', []);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="adjourned">Adjourned</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Court */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Court</label>
          <Input
            placeholder="Filter by court..."
            value={filters.court}
            onChange={(e) => updateFilter('court', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
