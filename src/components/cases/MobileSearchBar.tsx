import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MobileSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilterClick: () => void;
  activeFiltersCount?: number;
}

export const MobileSearchBar: React.FC<MobileSearchBarProps> = ({
  value,
  onChange,
  onFilterClick,
  activeFiltersCount = 0,
}) => {
  return (
    <div className="sticky top-14 z-30 bg-gray-50 px-3 py-3">
      <div className="flex items-center gap-2 bg-white rounded-2xl shadow-sm border border-border">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search cases..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9 h-10 border-0 bg-gray-50 focus-visible:ring-1"
        />
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={onFilterClick}
        className="h-10 w-10 flex-shrink-0 relative"
      >
        <SlidersHorizontal className="w-4 h-4" />
        {activeFiltersCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
            {activeFiltersCount}
          </span>
        )}
      </Button>
      </div>
    </div>
  );
};
