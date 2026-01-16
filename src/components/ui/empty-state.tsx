import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  className?: string;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  className,
  compact = false
}) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      compact ? "py-8 px-4" : "py-12 px-6",
      className
    )}>
      <div className={cn(
        "rounded-full bg-muted flex items-center justify-center mb-4",
        compact ? "w-12 h-12" : "w-16 h-16"
      )}>
        <Icon className={cn(
          "text-muted-foreground",
          compact ? "w-6 h-6" : "w-8 h-8"
        )} />
      </div>
      <h3 className={cn(
        "font-semibold text-foreground mb-2",
        compact ? "text-base" : "text-lg"
      )}>
        {title}
      </h3>
      <p className={cn(
        "text-muted-foreground max-w-sm",
        compact ? "text-xs" : "text-sm"
      )}>
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-4 gap-2"
          size={compact ? "sm" : "default"}
        >
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
