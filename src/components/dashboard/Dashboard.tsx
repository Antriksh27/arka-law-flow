
import React, { useMemo, useState } from 'react';
import { Calendar, Users, FileText, CheckCircle, MoreHorizontal, AlertCircle, Plus, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { startOfWeek, addDays, format, isToday, formatDistanceToNowStrict } from 'date-fns';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UploadDocumentDialog } from '@/components/documents/UploadDocumentDialog';

const Dashboard = () => {
  const { data, isLoading, error, isError } = useDashboardData();
  const [isUploadDialogOpen, setUploadDialogOpen] = useState(false);

  const dashboardMetrics = data ? [
    { number: data.metrics.activeCases, label: 'Active Cases' },
    { number: data.metrics.hearings, label: 'Upcoming Hearings' },
    { number: data.metrics.appointments, label: 'Appointments' },
    { number: data.metrics.tasks, label: 'Open Tasks' },
  ] : [];

  const weekSchedule = useMemo(() => {
    const today = new Date();
    // Setting weekStartsOn: 1 for Monday
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });

    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(startOfThisWeek, i);
      const dateString = format(date, 'yyyy-MM-dd');
      const eventCount = data?.schedule[dateString] || 0;
      return {
        day: format(date, 'EEE'), // 'Mon', 'Tue', etc.
        date: format(date, 'd'),
        isCurrentDay: isToday(date),
        eventCount: eventCount,
      };
    });
  }, [data]);

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return 'No due date';
    try {
      const date = new Date(dueDate);
      return `Due ${formatDistanceToNowStrict(date, { addSuffix: true })}`;
    } catch (e) {
      return 'Invalid date';
    }
  };

  if (isError) {
    return (
      <div className="p-6 bg-background min-h-screen">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading dashboard</AlertTitle>
          <AlertDescription>
            There was a problem fetching your dashboard data. Please try refreshing the page.
            {error && <pre className="mt-2 text-xs bg-red-100 p-2 rounded whitespace-pre-wrap">{error.message}</pre>}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, here's a summary of your firm's activity.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="p-6">
              <Skeleton className="h-20 w-full" />
            </Card>
          ))
        ) : (
          dashboardMetrics.map((metric, index) => <Card key={index} className="p-6 hover:shadow-md transition-shadow">
            <p className="text-sm text-muted-foreground mb-2">{metric.label}</p>
            <p className="text-3xl font-bold text-foreground">{metric.number}</p>
          </Card>)
        )}
      </div>

      {/* This Week's Schedule */}
      <Card className="p-6">
        <div className="flex w-full items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-foreground">
            This Week's Schedule
          </h3>
          <Button variant="ghost" className="text-primary">
            <Calendar className="mr-2 h-4 w-4" />
            View Calendar
          </Button>
        </div>
        <div className="w-full grid grid-cols-7 gap-2">
          {isLoading ? (
            Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center text-center gap-2 rounded-lg border p-4 border-gray-200 bg-white">
                <Skeleton className="h-24 w-full" />
              </div>
            ))
          ) : (
            weekSchedule.map((day, index) => {
              const isCurrentDay = day.isCurrentDay;
              const dayClasses = cn(
                  "flex flex-col items-center justify-center text-center gap-2 rounded-xl border p-4 h-32",
                  isCurrentDay ? "border-primary bg-accent" : "border-gray-200 bg-white"
              );
              const dayTextClasses = cn(
                  "text-sm font-medium",
                  isCurrentDay ? "text-primary" : "text-muted-foreground"
              );
              const dateTextClasses = cn(
                  "text-3xl font-bold",
                  isCurrentDay ? "text-primary" : "text-foreground"
              );

              return (
                  <div key={index} className={dayClasses}>
                    <span className={dayTextClasses}>
                      {day.day}
                    </span>
                    <span className={dateTextClasses}>
                      {day.date}
                    </span>
                    {day.eventCount > 0 && (
                      <Badge variant={isCurrentDay ? 'default' : 'secondary'} className="mt-1">
                          {day.eventCount} {day.eventCount === 1 ? 'Event' : 'Events'}
                      </Badge>
                    )}
                  </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - My Workspace */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold">My Workspace</CardTitle>
                <Button variant="link" className="text-sm">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* My Tasks */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2 text-foreground">
                      <CheckCircle className="w-5 h-5" />
                      My Tasks
                    </h3>
                    <Button size="sm" variant="secondary">
                      Add Task
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {isLoading ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-16 w-full rounded-lg" />) :
                      (data?.myTasks || []).map((task: any, index: number) => <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <h4 className="text-sm font-medium text-foreground">{task.title}</h4>
                            <Badge variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'warning' : 'success'}>
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{formatDueDate(task.due_date)}</p>
                        </div>)}
                  </div>
                </div>

                {/* My Notes */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2 text-foreground">
                      <FileText className="w-5 h-5" />
                      My Notes
                    </h3>
                    <Button size="sm" variant="secondary">
                      Add Note
                    </Button>
                  </div>
                  <div className="space-y-3">
                  {isLoading ? Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} className="h-20 w-full rounded-lg" />) :
                    (data?.myNotes || []).map((note: any, index: number) => <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <h4 className="text-sm font-medium text-foreground mb-1">{note.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{note.subtitle}</p>
                        <p className="text-xs text-gray-500">{note.date}</p>
                      </div>)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Workload */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold">Team Members</CardTitle>
                <Button variant="link" className="text-sm">View Full Team</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} className="h-10 w-full rounded-lg" />) :
                  (data?.teamMembers || []).map((member: any, index: number) => <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-muted-foreground">
                        {member.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-foreground">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.role}</div>
                      </div>
                    </div>
                  </div>)}
              </div>
            </CardContent>
          </Card>

          {/* Recent Case Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Recent Case Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} className="h-10 w-full rounded-lg" />) :
                (data?.recentActivity || []).map((activity: any, index: number) => <div key={index} className="flex gap-4">
                    <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0"></div>
                    <div>
                      <p className="text-sm text-foreground">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        By {activity.user} • {activity.time}
                      </p>
                    </div>
                  </div>)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions & Other */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start gap-3 h-11" variant="secondary">
                <Plus className="w-4 h-4" />
                Add Team Member
              </Button>
              <Button className="w-full justify-start gap-3 h-11" variant="secondary">
                <FileText className="w-4 h-4" />
                Create Invoice
              </Button>
              <Button className="w-full justify-start gap-3 h-11" variant="secondary" onClick={() => setUploadDialogOpen(true)}>
                <Upload className="w-4 h-4" />
                Upload Document
              </Button>
            </CardContent>
          </Card>

          {/* Revenue Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-24 w-full" /> : data && (
              <>
                <div className="text-left mb-4">
                  <p className="text-3xl font-bold text-foreground">₹{data.revenue.total.toLocaleString('en-IN')}</p>
                   <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                  <div className="bg-primary h-2.5 rounded-full" style={{
                  width: `${data.revenue.total > 0 ? (data.revenue.collected / data.revenue.total * 100) : 0}%`
                }}></div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Outstanding</span>
                    <span className="font-medium text-foreground">₹{data.revenue.outstanding.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Collected</span>
                    <span className="font-medium text-foreground">₹{data.revenue.collected.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </>
              )}
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Recent Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isLoading ? Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} className="h-8 w-full rounded-lg" />) :
                (data?.recentDocuments || []).map((doc: any, index: number) => <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                    </div>
                  </div>)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    <UploadDocumentDialog open={isUploadDialogOpen} onClose={() => setUploadDialogOpen(false)} />
  </>;
};
export default Dashboard;
