import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

export const SEARCHABLE_FIELDS: { value: string; label: string }[] = [
  { value: 'case_title', label: 'Case Title' },
  { value: 'petitioner', label: 'Petitioner' },
  { value: 'respondent', label: 'Respondent' },
  { value: 'case_number', label: 'Case Number' },
  { value: 'cnr_number', label: 'CNR Number' },
  { value: 'filing_number', label: 'Filing Number' },
  { value: 'reference_number', label: 'Reference No' },
  { value: 'registration_number', label: 'Registration No' },
];

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
  searchFields: string[];
  onSearchFieldsChange: (fields: string[]) => void;
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
  statusOptions,
  searchFields,
  onSearchFieldsChange,
}) => {
  const toggleField = (value: string) => {
    if (searchFields.includes(value)) {
      onSearchFieldsChange(searchFields.filter((f) => f !== value));
    } else {
      onSearchFieldsChange([...searchFields, value]);
    }
  };

  const allSelected = searchFields.length === 0 || searchFields.length === SEARCHABLE_FIELDS.length;
  const fieldLabel =
    searchFields.length === 0 || searchFields.length === SEARCHABLE_FIELDS.length
      ? 'All fields'
      : `${searchFields.length} field${searchFields.length > 1 ? 's' : ''}`;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-200 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1 flex items-stretch">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 sm:w-4 sm:h-4" />
            <Input
              placeholder={
                allSelected
                  ? 'Search cases across all fields...'
                  : `Search in ${searchFields
                      .map((f) => SEARCHABLE_FIELDS.find((s) => s.value === f)?.label)
                      .filter(Boolean)
                      .join(', ')}`
              }
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10 border-slate-900 h-12 sm:h-10 text-base rounded-r-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-slate-100"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="border-slate-900 border-l-0 rounded-l-none h-12 sm:h-10 px-3 gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden md:inline text-sm">{fieldLabel}</span>
                {!allSelected && (
                  <Badge variant="default" className="md:hidden">
                    {searchFields.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Search In
                </p>
                <button
                  type="button"
                  onClick={() => onSearchFieldsChange([])}
                  className="text-xs text-primary hover:underline"
                >
                  All
                </button>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {SEARCHABLE_FIELDS.map((field) => {
                  const checked =
                    searchFields.length === 0 || searchFields.includes(field.value);
                  return (
                    <label
                      key={field.value}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => {
                          // If currently "all" (empty), seed with all then toggle off the clicked one
                          if (searchFields.length === 0) {
                            onSearchFieldsChange(
                              SEARCHABLE_FIELDS.map((s) => s.value).filter(
                                (v) => v !== field.value
                              )
                            );
                          } else {
                            toggleField(field.value);
                          }
                        }}
                      />
                      <span className="text-sm text-slate-700">{field.label}</span>
                    </label>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
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
  );
};
