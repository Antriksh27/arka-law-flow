import React from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TimelineEvent {
  id: string;
  date: Date;
  title: string;
  description?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  metadata?: { label: string; value: string }[];
}

interface TimelineCardProps {
  events: TimelineEvent[];
  className?: string;
}

export const TimelineCard: React.FC<TimelineCardProps> = ({
  events,
  className,
}) => {
  const getStatusColor = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'upcoming':
        return 'bg-primary border-primary';
      case 'completed':
        return 'bg-success border-success';
      case 'cancelled':
        return 'bg-destructive border-destructive';
      default:
        return 'bg-muted border-muted';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const dotColor = getStatusColor(event.status);

        return (
          <div key={event.id} className="relative pl-8">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-border" />
            )}

            {/* Timeline dot */}
            <div
              className={cn(
                'absolute left-0 top-1 w-4 h-4 rounded-full border-2',
                dotColor
              )}
            />

            {/* Content card */}
            <div className="bg-card rounded-xl p-4 border border-border shadow-sm active:scale-[0.98] transition-transform">
              {/* Date */}
              <div className="text-xs text-muted-foreground font-medium mb-1">
                {format(event.date, 'MMM dd, yyyy')}
              </div>

              {/* Title */}
              <h3 className="text-base font-semibold text-foreground mb-1">
                {event.title}
              </h3>

              {/* Description */}
              {event.description && (
                <p className="text-sm text-muted-foreground mb-2">
                  {event.description}
                </p>
              )}

              {/* Metadata */}
              {event.metadata && event.metadata.length > 0 && (
                <div className="space-y-1 mt-2 pt-2 border-t border-border">
                  {event.metadata.map((meta, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {meta.label}:
                      </span>
                      <span className="text-foreground font-medium">
                        {meta.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
