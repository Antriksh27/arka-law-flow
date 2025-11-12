import React from 'react';
import { cn } from '@/lib/utils';

interface Segment {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps {
  segments: Segment[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  segments,
  value,
  onChange,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide',
        className
      )}
    >
      {segments.map((segment) => {
        const isActive = value === segment.value;
        return (
          <button
            key={segment.value}
            onClick={() => onChange(segment.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all active:scale-95 snap-start flex-shrink-0',
              isActive
                ? 'bg-primary text-primary-foreground font-medium'
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            {segment.icon && <span className="w-4 h-4">{segment.icon}</span>}
            <span className="text-sm">{segment.label}</span>
          </button>
        );
      })}
    </div>
  );
};
