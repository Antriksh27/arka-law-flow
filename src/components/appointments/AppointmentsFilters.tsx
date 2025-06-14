import React from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search, Calendar, Users, FileText, User } from 'lucide-react';
import { FilterState } from '../../pages/Appointments';
interface AppointmentsFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}
export const AppointmentsFilters: React.FC<AppointmentsFiltersProps> = ({
  filters,
  onFilterChange
}) => {
  const handleSearchChange = (value: string) => {
    onFilterChange({
      ...filters,
      searchQuery: value
    });
  };
  return <div className="flex w-full flex-wrap items-center gap-4">
      <div className="flex-1 min-w-[300px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input type="text" placeholder="Search appointments by client, case, or notes..." value={filters.searchQuery} onChange={e => handleSearchChange(e.target.value)} className="pl-10" />
        </div>
      </div>
      
      <Button variant="outline" className="flex items-center gap-2 border-gray-300 text-slate-50 bg-slate-900 hover:bg-slate-800">
        <Calendar className="h-4 w-4" />
        Date Range
      </Button>
      
      <Button variant="outline" className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50">
        <Users className="h-4 w-4" />
        Status
      </Button>
      
      <Button variant="outline" className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50">
        <User className="h-4 w-4" />
        Assigned To
      </Button>
      
      <Button variant="outline" className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50">
        <FileText className="h-4 w-4" />
        Client
      </Button>
    </div>;
};