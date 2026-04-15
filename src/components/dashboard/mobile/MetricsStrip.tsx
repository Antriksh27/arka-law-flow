import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gavel, CalendarClock, CheckSquare } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { bg } from '@/lib/colors';

interface Metric {
  label: string;
  value: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  route: string;
}

interface MetricsStripProps {
  todayHearings: number;
  todayAppointments: number;
  pendingTasks: number;
  isLoading?: boolean;
}

export const MetricsStrip: React.FC<MetricsStripProps> = ({
  todayHearings,
  todayAppointments,
  pendingTasks,
  isLoading,
}) => {
  const navigate = useNavigate();
  const { trigger: haptic } = useHapticFeedback();

  const handleMetricTap = (route: string) => {
    haptic('light');
    navigate(route);
  };

  const metrics: Metric[] = [
    {
      label: "Today's Hearings",
      value: todayHearings,
      icon: Gavel,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      route: '/hearings',
    },
    {
      label: "Today's Appointments",
      value: todayAppointments,
      icon: CalendarClock,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      route: '/appointments',
    },
    {
      label: 'Pending Tasks',
      value: pendingTasks,
      icon: CheckSquare,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      route: '/tasks',
    },
  ];

  if (isLoading) {
    return (
      <section className="mb-6">
        <h2 className="text-base font-semibold text-foreground mb-3">At a Glance</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 flex-1 min-w-[110px] bg-white rounded-2xl p-4 animate-pulse shadow-sm"
            >
              <div className={`w-10 h-10 ${bg.muted} rounded-xl mb-3`} />
              <div className={`h-8 ${bg.muted} rounded w-12 mb-2`} />
              <div className={`h-4 ${bg.muted} rounded w-20`} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold text-foreground mb-3">At a Glance</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <button
              key={index}
              onClick={() => handleMetricTap(metric.route)}
              className="flex-shrink-0 w-[160px] bg-white rounded-3xl p-5 shadow-sm border border-border/50 snap-center text-left active:scale-[0.97] transition-all duration-200"
            >
              <div className={`w-12 h-12 rounded-2xl ${metric.iconBg} flex items-center justify-center mb-4 shadow-sm`}>
                <Icon className={`w-6 h-6 ${metric.iconColor}`} />
              </div>
              <div className="text-3xl font-bold text-foreground tracking-tight">{String(metric.value).padStart(2, '0')}</div>
              <div className="text-sm font-medium text-muted-foreground mt-1 leading-tight">{metric.label}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
