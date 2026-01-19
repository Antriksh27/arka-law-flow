import React from 'react';
import { BottomSheet } from '@/components/mobile/BottomSheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface MobileFiltersSheetProps {
  open: boolean;
  onClose: () => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  assignedFilter: string;
  onAssignedChange: (value: string) => void;
  onClearFilters: () => void;
}

export const MobileFiltersSheet: React.FC<MobileFiltersSheetProps> = ({
  open,
  onClose,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  assignedFilter,
  onAssignedChange,
  onClearFilters,
}) => {
  const activeFiltersCount = [
    statusFilter !== 'all',
    typeFilter !== 'all',
    assignedFilter !== 'all'
  ].filter(Boolean).length;

  return (
    <BottomSheet open={open} onClose={onClose} title="Filter Cases">
      <div className="space-y-5 pb-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Status</label>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="disposed">Disposed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Case Type</label>
          <Select value={typeFilter} onValueChange={onTypeChange}>
            <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="civil">Civil</SelectItem>
              <SelectItem value="criminal">Criminal</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
              <SelectItem value="family">Family</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Assigned To</label>
          <Select value={assignedFilter} onValueChange={onAssignedChange}>
            <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="me">Assigned to Me</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={onClearFilters} 
            className="flex-1 h-12 rounded-xl border-border"
          >
            Clear {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>
          <Button 
            onClick={onClose} 
            className="flex-1 h-12 rounded-xl"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};
