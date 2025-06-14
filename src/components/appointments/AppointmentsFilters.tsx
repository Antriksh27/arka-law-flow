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
  return;
};