
import React, { useMemo } from 'react';
import { Calendar, Users, File, Folder, Plus, Upload, Download, Clock, User, FileText, CheckCircle, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { startOfWeek, addDays, format, isToday, isTomorrow, formatDistanceToNowStrict } from 'date-fns';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const { data, isLoading } = useDashboardData();

  const dashboardMetrics = data ? [
    { number: data.metrics.activeCases, label: 'Active Cases' },
    { number: data.metrics.hearings, label: 'Hearings' },
    { number: data.metrics.appointments, label: 'Appointments' },
    { number: data.metrics.tasks, label: 'Tasks' },
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

  return <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="p-4 bg-white border border-gray-200 shadow-sm">
              <Skeleton className="h-20 w-full" />
            </Card>
          ))
        ) : (
          dashboardMetrics.map((metric, index) => <Card key={index} className="p-4 bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center mb-2 shadow-sm">
                  <span className="text-xl font-bold text-gray-900">{metric.number}</span>
                </div>
                <p className="text-sm text-gray-600">{metric.label}</p>
              </div>
            </div>
          </Card>)
        )}
      </div>

      {/* This Week's Schedule */}
      <div className="flex w-full flex-col items-start gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-8">
        <div className="flex w-full items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            This Week's Schedule
          </h3>
          <Button variant="ghost">
            <Calendar className="mr-2 h-4 w-4" />
            View Calendar
          </Button>
        </div>
        <div className="w-full items-start gap-2 grid grid-cols-7">
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
                  "flex flex-col items-center text-center gap-2 rounded-lg border p-4",
                  isCurrentDay ? "border-primary bg-accent" : "border-gray-200 bg-white"
              );
              const dayTextClasses = cn(
                  "text-xs font-semibold",
                  isCurrentDay ? "text-primary" : "text-gray-600"
              );
              const dateTextClasses = cn(
                  "text-2xl font-bold",
                  isCurrentDay ? "text-primary" : "text-gray-900"
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
                      <Badge variant={isCurrentDay ? 'default' : 'secondary'}>
                          {day.eventCount} {day.eventCount === 1 ? 'Event' : 'Events'}
                      </Badge>
                    )}
                  </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - My Workspace */}
        <div className="col-span-8">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">My Workspace</CardTitle>
                <Button variant="link" className="text-blue-600 text-sm">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-8">
                {/* My Tasks */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      My Tasks
                    </h3>
                    <Button size="sm" variant="outline" className="border-blue-600 bg-slate-800 hover:bg-slate-700 text-slate-50">
                      Add Task
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {isLoading ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-16 w-full rounded-lg" />) :
                      (data?.myTasks || []).map((task: any, index: number) => <div key={index} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                            <span className={`text-xs px-2 py-1 rounded ${task.priority === 'High' ? 'bg-red-100 text-red-800' : task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                              {task.priority}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{formatDueDate(task.due_date)}</p>
                        </div>)}
                  </div>
                </div>

                {/* My Notes */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      My Notes
                    </h3>
                    <Button size="sm" variant="outline" className="border-blue-600 bg-slate-800 hover:bg-slate-700 text-slate-50">
                      Add Note
                    </Button>
                  </div>
                  <div className="space-y-3">
                  {isLoading ? Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} className="h-20 w-full rounded-lg" />) :
                    (data?.myNotes || []).map((note: any, index: number) => <div key={index} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">{note.title}</h4>
                        <p className="text-xs text-gray-600 mb-2">{note.subtitle}</p>
                        <p className="text-xs text-gray-500">{note.date}</p>
                      </div>)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Workload */}
          <Card className="mt-6 bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">Team Workload</CardTitle>
                <Button variant="link" className="text-blue-600 text-sm">View Full Team</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} className="h-10 w-full rounded-lg" />) :
                  (data?.teamMembers || []).map((member: any, index: number) => <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-xs font-medium shadow-sm">
                        {member.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{member.name}</div>
                        <div className="text-xs text-gray-500">{member.role}</div>
                      </div>
                    </div>
                  </div>)}
              </div>
            </CardContent>
          </Card>

          {/* Recent Case Activity */}
          <Card className="mt-6 bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Recent Case Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} className="h-10 w-full rounded-lg" />) :
                (data?.recentActivity || []).map((activity: any, index: number) => <div key={index} className="flex gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-gray-500">
                        By {activity.user} • {activity.time}
                      </p>
                    </div>
                  </div>)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions & Other */}
        <div className="col-span-4 space-y-6">
          {/* Quick Actions */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start gap-3 h-12 bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4" />
                Add Team Member
              </Button>
              <Button className="w-full justify-start gap-3 h-12 bg-gray-500 hover:bg-gray-600">
                <FileText className="w-4 h-4" />
                Create Invoice
              </Button>
              <Button className="w-full justify-start gap-3 h-12 bg-gray-500 hover:bg-gray-600">
                <Upload className="w-4 h-4" />
                Upload Document
              </Button>
            </CardContent>
          </Card>

          {/* Revenue Overview */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-24 w-full" /> : data && (
              <>
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold">₹{data.revenue.total.toLocaleString('en-IN')}</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div className="bg-orange-500 h-2 rounded-full" style={{
                  width: `${data.revenue.total > 0 ? (data.revenue.collected / data.revenue.total * 100) : 0}%`
                }}></div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Outstanding</span>
                    <span>₹{data.revenue.outstanding.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Collected</span>
                    <span>₹{data.revenue.collected.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </>
              )}
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Recent Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isLoading ? Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} className="h-8 w-full rounded-lg" />) :
                (data?.recentDocuments || []).map((doc: any, index: number) => <div key={index} className="flex items-center gap-3">
                    <span className="text-lg">{doc.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{doc.name}</p>
                    </div>
                  </div>)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};
export default Dashboard;
