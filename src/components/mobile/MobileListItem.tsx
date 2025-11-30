import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface MobileListItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  showChevron?: boolean;
}

export const MobileListItem: React.FC<MobileListItemProps> = ({
  children,
  onClick,
  className,
  showChevron = true,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "w-full bg-white rounded-xl p-4 border border-border",
        "active:scale-[0.98] transition-transform",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          {children}
        </div>
        {showChevron && onClick && (
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        )}
      </div>
    </div>
  );
};
