import { Briefcase, Calendar, CheckSquare, TrendingUp } from 'lucide-react';
import { HeroCard } from '@/components/mobile/HeroCard';

interface DashboardHeroStatsProps {
  activeCases: number;
  todayEvents: number;
  pendingTasks: number;
  weekEvents: number;
  isLoading?: boolean;
}

export const DashboardHeroStats = ({
  activeCases,
  todayEvents,
  pendingTasks,
  weekEvents,
  isLoading,
}: DashboardHeroStatsProps) => {
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-48 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/20 rounded-2xl" />
      </div>
    );
  }

  const metrics = [
    { label: 'Active Cases', value: activeCases, icon: Briefcase },
    { label: "Today's Events", value: todayEvents, icon: Calendar },
    { label: 'Pending Tasks', value: pendingTasks, icon: CheckSquare },
    { label: 'This Week', value: weekEvents, icon: TrendingUp },
  ];

  return (
    <HeroCard
      title="My Workspace"
      subtitle="Your legal practice overview"
      gradient={true}
    >
      <div className="grid grid-cols-2 gap-2 mt-3">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={index}
              className="bg-white/90 backdrop-blur-sm rounded-xl p-3 border border-border/50 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground font-medium">
                  {metric.label}
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {metric.value}
              </div>
            </div>
          );
        })}
      </div>
    </HeroCard>
  );
};
