
import React from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search, Clock, History } from 'lucide-react';
import { FilterState } from '../../pages/Appointments';

interface AppointmentsFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export const AppointmentsFilters: React.FC<AppointmentsFiltersProps> = ({
  filters,
  onFilterChange
}) => {
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      searchQuery: event.target.value
    });
  };

  const togglePastAppointments = () => {
    onFilterChange({
      ...filters,
      showPastAppointments: !filters.showPastAppointments
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-white border-b border-gray-200">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search appointments..."
          value={filters.searchQuery}
          onChange={handleSearchChange}
          className="pl-10 pr-4 py-2 w-full md:w-64 border-gray-300 rounded-lg focus:ring-primary-blue focus:border-primary-blue"
        />
      </div>
      
      <Button
        variant={filters.showPastAppointments ? "default" : "outline"}
        onClick={togglePastAppointments}
        className="flex items-center gap-2"
      >
        {filters.showPastAppointments ? <History className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
        {filters.showPastAppointments ? "Hide Past" : "Show Past"}
      </Button>
      {/* Placeholder for other filter controls */}
      {/* 
      Example for a select filter (conceptual, needs actual implementation and state management):
      <Select onValueChange={(value) => onFilterChange({...filters, status: [value]})} value={filters.status.length > 0 ? filters.status[0] : ""}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="scheduled">Scheduled</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select> 
      */}
    </div>
  );
};
