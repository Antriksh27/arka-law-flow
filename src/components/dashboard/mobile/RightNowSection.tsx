import React from 'react';
import { Clock, Calendar, CheckSquare, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Event {
  id: string;
  type: 'hearing' | 'appointment' | 'task';
  title: string;
  subtitle: string;
  time: Date;
  action?: string;
  actionPath?: string;
}

interface RightNowSectionProps {
  events: Event[];
  isLoading?: boolean;
}

export const RightNowSection: React.FC<RightNowSectionProps> = ({ events, isLoading }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <section className="mb-6">
        <h2 className="text-base font-semibold text-foreground mb-3">Right Now</h2>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/4 mb-2" />
              <div className="h-5 bg-muted rounded w-3/4 mb-1" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section className="mb-6">
        <h2 className="text-base font-semibold text-foreground mb-3">Right Now</h2>
        <div className="bg-card rounded-xl border border-border p-6 text-center">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">All clear for now</p>
          <button
            onClick={() => navigate('/appointments')}
            className="text-sm font-medium text-primary hover:underline"
          >
            Schedule Something
          </button>
        </div>
      </section>
    );
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'hearing':
        return 'border-l-red-500';
      case 'appointment':
        return 'border-l-primary';
      case 'task':
        return 'border-l-green-500';
      default:
        return 'border-l-muted';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'hearing':
        return Calendar;
      case 'appointment':
        return Calendar;
      case 'task':
        return CheckSquare;
      default:
        return Clock;
    }
  };

  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold text-foreground mb-3">Right Now</h2>
      <div className="space-y-3">
        {events.slice(0, 3).map((event) => {
          const Icon = getEventIcon(event.type);
          return (
            <button
              key={event.id}
              onClick={() => event.actionPath && navigate(event.actionPath)}
              className={`w-full bg-card rounded-xl border border-border ${getEventColor(
                event.type
              )} border-l-4 p-4 text-left transition-all active:scale-[0.98] hover:shadow-md`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {format(event.time, 'h:mm a')}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1 truncate">
                    {event.title}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">{event.subtitle}</p>
                </div>
                {event.action && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
