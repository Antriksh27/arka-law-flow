import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Plus, Calendar, User, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { CreateTaskDialog } from '../tasks/CreateTaskDialog';
import { useToast } from '@/hooks/use-toast';

interface CaseTasksProps {
  caseId: string;
}

export const CaseTasks: React.FC<CaseTasksProps> = ({
  caseId
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const {
    data: tasks,
    isLoading
  } = useQuery({
    queryKey: ['case-tasks', caseId],
    queryFn: async () => {
      console.log('Fetching case tasks for caseId:', caseId);
      const {
        data,
        error
      } = await supabase.from('tasks').select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(full_name),
          creator:profiles!tasks_created_by_fkey(full_name)
        `).eq('case_id', caseId).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching case tasks:', error);
        throw error;
      }
      console.log('Fetched case tasks:', data);
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
        queryKey: ['case-tasks', caseId]
      });
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'todo':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  const tasksByStatus = {
    todo: tasks?.filter(task => task.status === 'todo') || [],
    in_progress: tasks?.filter(task => task.status === 'in_progress') || [],
    completed: tasks?.filter(task => task.status === 'completed') || []
  };
  const handleStatusChange = (taskId: string, newStatus: 'todo' | 'in_progress' | 'completed') => {
    updateTaskMutation.mutate({
      taskId,
      status: newStatus
    });
  };
  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'todo':
        return 'To do';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };
  if (isLoading) {
    return <div className="text-center py-8">Loading tasks...</div>;
  }
  return <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">Tasks</h3>
        <Button 
          onClick={() => setShowCreateDialog(true)} 
          className="bg-slate-800 hover:bg-slate-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {tasks && tasks.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => <Card key={status} className="h-fit bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-3 bg-gray-50 border-b border-gray-100">
                <CardTitle className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                  {getStatusDisplayName(status)} ({statusTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {statusTasks.map(task => <div key={task.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow hover:bg-white">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-sm text-gray-900 line-clamp-2">{task.title}</h4>
                      <Badge className={`${getPriorityColor(task.priority)} text-xs rounded-full border`}>
                        {task.priority}
                      </Badge>
                    </div>
                    
                    {task.description && <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>}
                    
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

                    {status !== 'completed' && <div className="flex gap-2 mt-3">
                        {status === 'todo' && <Button size="sm" variant="outline" onClick={() => handleStatusChange(task.id, 'in_progress')} className="text-xs bg-white hover:bg-gray-50 border-gray-300">
                            Start
                          </Button>}
                        {status === 'in_progress' && <Button size="sm" variant="outline" onClick={() => handleStatusChange(task.id, 'completed')} className="text-xs bg-white hover:bg-gray-50 border-gray-300">
                            Complete
                          </Button>}
                      </div>}
                  </div>)}
                
                {statusTasks.length === 0 && <div className="text-center py-8 text-gray-400">
                    <CheckSquare className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs">No {getStatusDisplayName(status).toLowerCase()} tasks</p>
                  </div>}
              </CardContent>
            </Card>)}
        </div> : <div className="text-center py-12 text-gray-500">
          <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No tasks created yet</p>
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Task
          </Button>
        </div>}

      <CreateTaskDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} caseId={caseId} />
    </div>;
};
