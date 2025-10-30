import React, { useMemo, useState } from 'react';
import { Calendar, Users, Plus, Upload, FileText, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { startOfWeek, addDays, format, isToday } from 'date-fns';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { GlobalSearch } from './GlobalSearch';
import { TodayAppointmentsCard } from './TodayAppointmentsCard';
import { UpcomingHearingsCard } from './UpcomingHearingsCard';
import { RecentClientsCard } from './RecentClientsCard';
import { RecentContactsCard } from './RecentContactsCard';
import { CaseHighlightsCard } from './CaseHighlightsCard';
import { ChatWidget } from './ChatWidget';
import { DailyTimeline } from './DailyTimeline';
import { LegalNewsFeed } from './LegalNewsFeed';

const EnhancedDashboard = () => {
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useDashboardData();
  const [timeFilter, setTimeFilter] = useState('today');

  const dashboardMetrics = data ? [
    { number: data.metrics.activeCases, label: 'Active Cases' },
    { number: data.metrics.hearings, label: 'Hearings' },
    { number: data.metrics.appointments, label: 'Appointments' },
    { number: data.metrics.tasks, label: 'Tasks' },
  ] : [];

  const weekSchedule = useMemo(() => {
    const today = new Date();
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(startOfThisWeek, i);
      const dateString = format(date, 'yyyy-MM-dd');
      return {
        day: format(date, 'EEE'),
        date: format(date, 'd'),
        isCurrentDay: isToday(date),
        eventCount: data?.schedule[dateString] || 0,
      };
    });
  }, [data]);

  if (isError) {
    return (
      <div className="p-6 bg-background min-h-screen">
        <Alert variant="destructive">
          <AlertTitle>Error loading dashboard</AlertTitle>
          <AlertDescription>Please try refreshing the page.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const userRole = data?.role || 'admin';

  return (
    <div className="p-6 bg-background min-h-screen">
      {/* Header with Search */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Welcome back, {user?.user_metadata?.full_name || 'User'}</h1>
            <p className="text-muted-foreground">Here's what's happening today</p>
          </div>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <GlobalSearch />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          dashboardMetrics.map((metric, i) => (
            <Card key={i} className="p-4">
              <div className="text-3xl font-bold">{metric.number}</div>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
            </Card>
          ))
        )}
      </div>

      {/* Week Schedule */}
      <Card className="mb-8 p-6">
        <h3 className="text-lg font-medium mb-4">This Week's Schedule</h3>
        <div className="grid grid-cols-7 gap-2">
          {weekSchedule.map((day, i) => (
            <div key={i} className={cn("p-4 rounded-lg border text-center", day.isCurrentDay && "bg-primary/10 border-primary")}>
              <div className="text-xs font-medium">{day.day}</div>
              <div className="text-2xl font-bold">{day.date}</div>
              {day.eventCount > 0 && <div className="text-xs mt-1">{day.eventCount} events</div>}
            </div>
          ))}
        </div>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TodayAppointmentsCard appointments={data?.todayAppointments || []} isLoading={isLoading} />
        <UpcomingHearingsCard hearings={data?.upcomingHearings || []} isLoading={isLoading} />
        <RecentClientsCard clients={data?.recentClients || []} isLoading={isLoading} />
        <RecentContactsCard contacts={data?.recentContacts || []} isLoading={isLoading} />
        <CaseHighlightsCard cases={data?.caseHighlights || []} isLoading={isLoading} />
        <ChatWidget />
        <DailyTimeline events={data?.timelineEvents || []} isLoading={isLoading} />
        <LegalNewsFeed />
      </div>
    </div>
  );
};

export default EnhancedDashboard;
