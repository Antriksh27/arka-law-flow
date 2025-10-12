import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Bell, TrendingUp, Users, Activity, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NotificationStats {
  total_notifications: number;
  read_notifications: number;
  unread_notifications: number;
  delivery_rate: number;
  category_breakdown: Record<string, number>;
  priority_breakdown: Record<string, number>;
  daily_statistics: Array<{
    date: string;
    total: number;
    read: number;
    unread: number;
  }>;
  period_days: number;
  generated_at: string;
}

interface TopRecipient {
  user_id: string;
  full_name: string;
  total_received: number;
  unread_count: number;
  read_rate: number;
}

interface RecentActivity {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  recipient_name: string;
  created_at: string;
  read: boolean;
}

export const NotificationAnalytics: React.FC = () => {
  const [periodDays, setPeriodDays] = useState<number>(7);

  // Get current user's firm
  const { data: firmId } = useQuery({
    queryKey: ['user-firm'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from('team_members')
        .select('firm_id')
        .eq('user_id', user.id)
        .single();
      
      return data?.firm_id;
    },
  });

  // Get notification statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['notification-statistics', firmId, periodDays],
    queryFn: async () => {
      if (!firmId) return null;
      
      const { data, error } = await supabase.rpc('get_notification_statistics', {
        p_firm_id: firmId,
        p_days: periodDays,
      });
      
      if (error) throw error;
      return data as unknown as NotificationStats;
    },
    enabled: !!firmId,
    refetchInterval: 60000, // Refresh every minute
  });

  // Get top recipients
  const { data: topRecipients, isLoading: recipientsLoading } = useQuery({
    queryKey: ['top-notification-recipients', firmId],
    queryFn: async () => {
      if (!firmId) return null;
      
      const { data, error } = await supabase.rpc('get_top_notification_recipients', {
        p_firm_id: firmId,
        p_limit: 10,
      });
      
      if (error) throw error;
      return data as TopRecipient[];
    },
    enabled: !!firmId,
  });

  // Get recent activity
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['recent-notification-activity', firmId],
    queryFn: async () => {
      if (!firmId) return null;
      
      const { data, error } = await supabase.rpc('get_recent_notification_activity', {
        p_firm_id: firmId,
        p_limit: 20,
      });
      
      if (error) throw error;
      return data as RecentActivity[];
    },
    enabled: !!firmId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Notification Analytics</h2>
        <Select value={periodDays.toString()} onValueChange={(v) => setPeriodDays(parseInt(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_notifications || 0}</div>
            <p className="text-xs text-muted-foreground">Last {periodDays} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.delivery_rate || 0}%</div>
            <p className="text-xs text-muted-foreground">Read notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.read_notifications || 0}</div>
            <p className="text-xs text-muted-foreground">Acknowledged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.unread_notifications || 0}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="breakdown" className="space-y-4">
        <TabsList>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="recipients">Top Recipients</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>By Category</CardTitle>
                <CardDescription>Notification distribution by type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(stats?.category_breakdown || {}).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="capitalize text-sm">{category}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Priority Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>By Priority</CardTitle>
                <CardDescription>Notification distribution by urgency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(stats?.priority_breakdown || {}).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <span className="capitalize text-sm">{priority}</span>
                    <Badge 
                      variant={priority === 'urgent' ? 'error' : priority === 'high' ? 'warning' : 'outline'}
                    >
                      {count}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recipients">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Notification Recipients
              </CardTitle>
              <CardDescription>Users receiving the most notifications (last 30 days)</CardDescription>
            </CardHeader>
            <CardContent>
              {recipientsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {topRecipients?.map((recipient) => (
                    <div key={recipient.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{recipient.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {recipient.total_received} notifications • {recipient.unread_count} unread
                        </p>
                      </div>
                      <Badge variant={recipient.read_rate > 70 ? 'success' : 'outline'}>
                        {recipient.read_rate}% read rate
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Notification Activity
              </CardTitle>
              <CardDescription>Latest notifications sent</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity?.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      {activity.read ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{activity.title}</p>
                          <Badge variant="outline" className="capitalize text-xs">
                            {activity.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{activity.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          To: {activity.recipient_name} • {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
