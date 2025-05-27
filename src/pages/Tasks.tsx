import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare, Plus, Calendar, User, Tag, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { CreateTaskDialog } from '../components/tasks/CreateTaskDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
const Tasks = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const {
    data: tasks = [],
    isLoading
  } = useQuery({
    queryKey: ['tasks', searchTerm, statusFilter, priorityFilter, assigneeFilter],
    queryFn: async () => {
      let query = supabase.from('tasks').select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(full_name),
          creator:profiles!tasks_created_by_fkey(full_name),
          case:cases!tasks_matter_id_fkey(title)
        `).order('created_at', {
        ascending: false
      });
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'todo' | 'in_progress' | 'completed');
      }
      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter as 'low' | 'medium' | 'high');
      }
      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'unassigned') {
          query = query.is('assigned_to', null);
        } else {
          query = query.eq('assigned_to', assigneeFilter);
        }
      }
      const {
        data,
        error
      } = await query;
      if (error) throw error;
      return data || [];
    }
  });
  const {
    data: teamMembers = []
  } = useQuery({
    queryKey: ['team-members-filter'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('profiles').select('id, full_name').in('role', ['admin', 'lawyer', 'paralegal', 'junior', 'associate', 'partner']).order('full_name');
      if (error) throw error;
      return data || [];
    }
  });
  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      status
    }: {
      taskId: string;
      status: 'todo' | 'in_progress' | 'completed';
    }) => {
      const {
        error
      } = await supabase.from('tasks').update({
        status
      }).eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tasks']
      });
      toast({
        title: "Task updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Failed to update task",
        variant: "destructive"
      });
    }
  });
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  const tasksByStatus = {
    todo: tasks.filter(task => task.status === 'todo'),
    in_progress: tasks.filter(task => task.status === 'in_progress'),
    completed: tasks.filter(task => task.status === 'completed')
  };
  const handleStatusChange = (taskId: string, newStatus: 'todo' | 'in_progress' | 'completed') => {
    updateTaskMutation.mutate({
      taskId,
      status: newStatus
    });
  };
  const TaskCard = ({
    task
  }: {
    task: any;
  }) => <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow hover:bg-white">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-sm text-gray-900 line-clamp-2">{task.title}</h4>
        <Badge className={`${getPriorityColor(task.priority)} text-xs rounded-full border`}>
          {task.priority}
        </Badge>
      </div>
      
      {task.description && <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>}

      {task.case && <div className="text-xs text-blue-600 mb-2">
          Case: {task.case.title}
        </div>}
      
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span className="truncate">{task.assigned_user?.full_name || 'Unassigned'}</span>
        </div>
        {task.due_date && <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(new Date(task.due_date), 'MMM d')}
          </div>}
      </div>

      {task.tags && task.tags.length > 0 && <div className="flex items-center gap-1 mb-3">
          <Tag className="w-3 h-3 text-gray-400" />
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 2).map((tag: string) => <span key={tag} className="text-xs bg-white text-gray-600 px-2 py-1 rounded border border-gray-200">
                {tag}
              </span>)}
            {task.tags.length > 2 && <span className="text-xs text-gray-400">+{task.tags.length - 2}</span>}
          </div>
        </div>}

      {task.status !== 'completed' && <div className="flex gap-2 mt-3">
          {task.status === 'todo' && <Button size="sm" variant="outline" onClick={() => handleStatusChange(task.id, 'in_progress')} className="text-xs bg-white hover:bg-gray-50 border-gray-300">
              Start
            </Button>}
          {task.status === 'in_progress' && <Button size="sm" variant="outline" onClick={() => handleStatusChange(task.id, 'completed')} className="text-xs bg-white hover:bg-gray-50 border-gray-300">
              Complete
            </Button>}
        </div>}
    </div>;
  if (isLoading) {
    return <DashboardLayout>
        <div className="text-center py-8">Loading tasks...</div>
      </DashboardLayout>;
  }
  return <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Task Management</h1>
            <p className="text-gray-600 mt-1">Manage and track all tasks across your cases</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-slate-800 hover:bg-slate-700">
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input placeholder="Search tasks..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-64 bg-white border-gray-300" />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-white border-gray-300">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40 bg-white border-gray-300">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-48 bg-white border-gray-300">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamMembers.map(member => <SelectItem key={member.id} value={member.id}>
                      {member.full_name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Task Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{tasksByStatus.todo.length}</div>
              <div className="text-sm text-gray-600">To Do</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">{tasksByStatus.in_progress.length}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{tasksByStatus.completed.length}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Display */}
        {tasks.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(tasksByStatus).map(([status, statusTasks]) => <Card key={status} className="h-fit bg-white border-gray-200 shadow-sm">
                <CardHeader className="pb-3 bg-gray-50 border-b border-gray-100">
                  <CardTitle className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                    {status.replace('_', ' ')} ({statusTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  {statusTasks.map(task => <TaskCard key={task.id} task={task} />)}
                  
                  {statusTasks.length === 0 && <div className="text-center py-8 text-gray-400">
                      <CheckSquare className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-xs">No {status.replace('_', ' ')} tasks</p>
                    </div>}
                </CardContent>
              </Card>)}
          </div> : <div className="text-center py-12 text-gray-500">
            <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No tasks found</p>
            <p className="text-gray-400 mb-6">Get started by creating your first task</p>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Task
            </Button>
          </div>}

        <CreateTaskDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />
      </div>
    </DashboardLayout>;
};
export default Tasks;