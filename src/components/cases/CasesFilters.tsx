
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
}

export const CasesFilters: React.FC<CasesFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  assignedFilter,
  onAssignedChange
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search cases by title or client..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 border-slate-900"
          />
        </div>

        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-32 bg-white border-slate-900">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_court">In Court</SelectItem>
            <SelectItem value="disposed">Disposed</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={onTypeChange}>
          <SelectTrigger className="w-36 bg-white border-slate-900">
            <SelectValue placeholder="Case Type" />
          </SelectTrigger>
          <SelectContent className="bg-white">
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
          <SelectTrigger className="w-36 bg-white border-slate-900">
            <SelectValue placeholder="Assigned To" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="me">Assigned to Me</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
