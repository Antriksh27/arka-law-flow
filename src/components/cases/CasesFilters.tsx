
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CasesFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  assignedFilter: string;
  onAssignedChange: (value: string) => void;
  statusOptions?: string[];
}

export const CasesFilters: React.FC<CasesFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  assignedFilter,
  onAssignedChange,
  statusOptions
}) => {
  return (
    <div className="sticky top-0 z-40 bg-gray-50 pb-4 pt-4">
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 sm:w-4 sm:h-4" />
          <Input
            placeholder="Search cases by title or client..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 border-slate-900 h-12 sm:h-10 text-base"
          />
        </div>

        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-32 bg-white border-slate-900 h-12 sm:h-10 text-base sm:text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions?.map((s) => (
              <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={onTypeChange}>
          <SelectTrigger className="w-full sm:w-36 bg-white border-slate-900 h-12 sm:h-10 text-base sm:text-sm">
            <SelectValue placeholder="Case Type" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="civil">Civil</SelectItem>
            <SelectItem value="criminal">Criminal</SelectItem>
            <SelectItem value="corporate">Corporate</SelectItem>
            <SelectItem value="family">Family</SelectItem>
            <SelectItem value="tax">Tax</SelectItem>
            <SelectItem value="labor">Labor</SelectItem>
            <SelectItem value="intellectual_property">IP</SelectItem>
            <SelectItem value="real_estate">Real Estate</SelectItem>
          </SelectContent>
        </Select>

        <Select value={assignedFilter} onValueChange={onAssignedChange}>
          <SelectTrigger className="w-full sm:w-36 bg-white border-slate-900 h-12 sm:h-10 text-base sm:text-sm">
            <SelectValue placeholder="Assigned To" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="me">Assigned to Me</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>
      </div>
      </div>
    </div>
  );
};
