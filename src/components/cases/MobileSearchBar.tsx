import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MobileSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilterClick?: () => void;
  activeFiltersCount?: number;
}

export const MobileSearchBar: React.FC<MobileSearchBarProps> = ({
  value,
  onChange,
  onFilterClick,
  activeFiltersCount = 0,
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Search cases..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 h-12 border-border bg-card rounded-2xl shadow-sm text-base focus-visible:ring-1"
        />
      </div>
      {onFilterClick && (
        <Button
          variant="outline"
          size="icon"
          onClick={onFilterClick}
          className="h-12 w-12 flex-shrink-0 relative rounded-2xl border-border bg-card shadow-sm"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      )}
    </div>
  );
};
