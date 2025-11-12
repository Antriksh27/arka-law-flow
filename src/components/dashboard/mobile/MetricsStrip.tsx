import React from 'react';
import { Briefcase, Calendar, CheckSquare, TrendingUp, MessageSquare } from 'lucide-react';

interface Metric {
  label: string;
  value: number;
  icon: React.ElementType;
  bgColor: string;
}

interface MetricsStripProps {
  activeCases: number;
  todayEvents: number;
  pendingTasks: number;
  weekEvents: number;
  newMessages?: number;
  isLoading?: boolean;
}

export const MetricsStrip: React.FC<MetricsStripProps> = ({
  activeCases,
  todayEvents,
  pendingTasks,
  weekEvents,
  newMessages = 0,
  isLoading,
}) => {
  const metrics: Metric[] = [
    {
      label: 'Active Cases',
      value: activeCases,
      icon: Briefcase,
      bgColor: 'bg-blue-50 text-blue-700',
    },
    {
      label: "Today's Events",
      value: todayEvents,
      icon: Calendar,
      bgColor: 'bg-purple-50 text-purple-700',
    },
    {
      label: 'Pending Tasks',
      value: pendingTasks,
      icon: CheckSquare,
      bgColor: 'bg-green-50 text-green-700',
    },
    {
      label: 'This Week',
      value: weekEvents,
      icon: TrendingUp,
      bgColor: 'bg-orange-50 text-orange-700',
    },
  ];

  if (newMessages > 0) {
    metrics.push({
      label: 'New Messages',
      value: newMessages,
      icon: MessageSquare,
      bgColor: 'bg-pink-50 text-pink-700',
    });
  }

  if (isLoading) {
    return (
      <section className="mb-6">
        <h2 className="text-base font-semibold text-foreground mb-3">At a Glance</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-32 bg-card rounded-xl border border-border p-4 animate-pulse"
            >
              <div className="h-8 bg-muted rounded mb-2" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold text-foreground mb-3">At a Glance</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={index}
              className="flex-shrink-0 w-32 bg-card rounded-xl border border-border p-4 shadow-sm snap-start"
            >
              <div className={`w-8 h-8 rounded-lg ${metric.bgColor} flex items-center justify-center mb-2`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{metric.value}</div>
              <div className="text-xs text-muted-foreground leading-tight">{metric.label}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
