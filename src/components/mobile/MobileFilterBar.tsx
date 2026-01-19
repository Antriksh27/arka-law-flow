import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface FilterChip {
  id: string;
  label: string;
  count?: number;
}

interface MobileFilterBarProps {
  filters: FilterChip[];
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
  className?: string;
}

export const MobileFilterBar: React.FC<MobileFilterBarProps> = ({
  filters,
  activeFilter,
  onFilterChange,
  className,
}) => {
  return (
    <div className={cn("sticky top-[112px] z-[var(--z-sticky)] bg-gray-50 overflow-x-auto scrollbar-hide", className)}>
      <div className="flex gap-2 px-3 pb-4">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={cn(
              "flex-shrink-0 px-4 h-9 rounded-full font-medium text-sm transition-all active:scale-95",
              "whitespace-nowrap",
              activeFilter === filter.id
                ? "bg-slate-800 text-white"
                : "bg-white border border-border text-foreground hover:bg-accent"
            )}
          >
            {filter.label}
            {filter.count !== undefined && (
              <span className="ml-1.5 opacity-70">({filter.count})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
