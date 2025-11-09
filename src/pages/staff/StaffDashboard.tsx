import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { CheckSquare, Clock, AlertTriangle, FileText, Upload, Plus, Calendar, MessageSquareText, FolderOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
interface DashboardStats {
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  todayDeadlines: number;
  pendingInstructions: number;
  documentsUploaded: number;
}
interface RecentActivity {
  id: string;
  type: 'task' | 'instruction' | 'document';
  title: string;
  status: string;
  time: string;
  priority?: string;
}
const StaffDashboard = () => {
  const {
    user
  } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    todayDeadlines: 0,
    pendingInstructions: 0,
    documentsUploaded: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchDashboardData();
  }, [user]);
  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      // Fetch task statistics
      const {
        data: tasks
      } = await supabase.from('tasks').select('status, due_date').or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`);

      // Fetch instruction statistics
      const {
        data: instructions
      } = await supabase.from('instructions').select('status, deadline').eq('staff_id', user.id);

      // Fetch document statistics for today
      const today = new Date().toISOString().split('T')[0];
      const {
        data: documents
      } = await supabase.from('documents').select('id').eq('uploaded_by', user.id).gte('uploaded_at', today);

      // Calculate statistics
      const taskStats = {
        pendingTasks: tasks?.filter(t => t.status === 'todo').length || 0,
        inProgressTasks: tasks?.filter(t => t.status === 'in_progress').length || 0,
        completedTasks: tasks?.filter(t => t.status === 'completed').length || 0,
        todayDeadlines: tasks?.filter(t => t.due_date === today).length || 0
      };
      setStats({
        ...taskStats,
        pendingInstructions: instructions?.filter(i => i.status === 'pending').length || 0,
        documentsUploaded: documents?.length || 0
      });

      // Fetch recent activity
      await fetchRecentActivity();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchRecentActivity = async () => {
    if (!user) return;
    try {
      const activities: RecentActivity[] = [];

      // Recent tasks
      const {
        data: recentTasks
      } = await supabase.from('tasks').select('id, title, status, updated_at, priority').or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`).order('updated_at', {
        ascending: false
      }).limit(3);
      recentTasks?.forEach(task => {
        activities.push({
          id: task.id,
          type: 'task',
          title: task.title,
          status: task.status,
          time: new Date(task.updated_at).toLocaleTimeString(),
          priority: task.priority
        });
      });

      // Recent instructions
      const {
        data: recentInstructions
      } = await supabase.from('instructions').select('id, message, status, updated_at, priority').eq('staff_id', user.id).order('updated_at', {
        ascending: false
      }).limit(2);
      recentInstructions?.forEach(instruction => {
        activities.push({
          id: instruction.id,
          type: 'instruction',
          title: instruction.message.substring(0, 50) + '...',
          status: instruction.status,
          time: new Date(instruction.updated_at).toLocaleTimeString(),
          priority: instruction.priority
        });
      });
      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'error';
      case 'in_progress':
        return 'default';
      case 'completed':
      case 'done':
        return 'success';
      default:
        return 'outline';
    }
  };
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'default';
      case 'low':
        return 'success';
      default:
        return 'outline';
    }
  };
  if (loading) {
    return <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>;
  }
  return <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Staff Dashboard</h1>
          <p className="text-muted-foreground">Manage your daily tasks and responsibilities</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/documents?action=upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/tasks?action=create">
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayDeadlines}</div>
          </CardContent>
        </Card>

        

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Docs Uploaded</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.documentsUploaded}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? <p className="text-muted-foreground text-center py-4">No recent activity</p> : recentActivity.map(activity => <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getStatusColor(activity.status)} className="text-xs">
                          {activity.status.replace('_', ' ')}
                        </Badge>
                        {activity.priority && <Badge variant={getPriorityColor(activity.priority)} className="text-xs">
                            {activity.priority}
                          </Badge>}
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    </div>
                  </div>)}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-20 flex-col" asChild>
                <Link to="/documents?action=upload">
                  <Upload className="w-6 h-6 mb-2" />
                  Upload Document
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col" asChild>
                <Link to="/tasks?action=create">
                  <Plus className="w-6 h-6 mb-2" />
                  Create Task
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col" asChild>
                <Link to="/cases">
                  <FolderOpen className="w-6 h-6 mb-2" />
                  View Cases
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col" asChild>
                <Link to="/chat">
                  <MessageSquareText className="w-6 h-6 mb-2" />
                  Messages
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default StaffDashboard;