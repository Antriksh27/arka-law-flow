import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Plus, Calendar, User, Tag } from 'lucide-react';
import { TimeUtils } from '@/lib/timeUtils';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface TasksTabProps {
  caseId: string;
}

export const TasksTab: React.FC<TasksTabProps> = ({ caseId }) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['case-tasks', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(full_name),
          creator:profiles!tasks_created_by_fkey(full_name)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: 'todo' | 'in_progress' | 'completed' }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-tasks', caseId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: "Task updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update task", variant: "destructive" });
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
    updateTaskMutation.mutate({ taskId, status: newStatus });
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

  const isMobile = useIsMobile();

  // Progress calculation
  const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
  const totalTasks = tasks?.length || 0;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Tasks</h3>
          {totalTasks > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {completedTasks} of {totalTasks} completed ({progressPercent}%)
            </p>
          )}
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size={isMobile ? "sm" : "default"}>
          <Plus className="w-4 h-4 mr-2" />
          {isMobile ? 'Add' : 'Add Task'}
        </Button>
      </div>

      {/* Progress Bar */}
      {totalTasks > 0 && (
        <div className="bg-muted rounded-full h-2 overflow-hidden">
          <div 
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {tasks && tasks.length > 0 ? (
        isMobile ? (
          // Mobile: Vertical List
          <div className="space-y-3">
            {tasks.map(task => (
              <Card key={task.id} className="p-4 hover:shadow-md transition-shadow bg-card border-border">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm text-foreground flex-1 line-clamp-2">{task.title}</h4>
                    <div className="flex gap-2 flex-shrink-0">
                      <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                        {task.priority}
                      </Badge>
                      <Badge className={`${getStatusColor(task.status)} text-xs`}>
                        {getStatusDisplayName(task.status)}
                      </Badge>
                    </div>
                  </div>
                  
                  {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span className="truncate">{task.assigned_user?.full_name || 'Unassigned'}</span>
                    </div>
                    {task.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {TimeUtils.formatDate(task.due_date, 'dd MMM')}
                      </div>
                    )}
                  </div>

                  {task.status !== 'completed' && (
                    <div className="flex gap-2 pt-2">
                      {task.status === 'todo' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(task.id, 'in_progress')}
                          className="flex-1 h-9"
                        >
                          Start
                        </Button>
                      )}
                      {task.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(task.id, 'completed')}
                          className="flex-1 h-9"
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          // Desktop: 3-column Kanban
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
              <Card key={status} className="h-fit bg-card border-border shadow-sm">
                <div className="p-4 bg-muted/50 border-b border-border">
                  <h4 className="text-sm font-medium text-foreground uppercase tracking-wide">
                    {getStatusDisplayName(status)} ({statusTasks.length})
                  </h4>
                </div>
                <div className="space-y-3 p-4">
                  {statusTasks.map(task => (
                    <div key={task.id} className="bg-background rounded-lg p-4 border border-border shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-sm text-foreground line-clamp-2">{task.title}</h4>
                        <Badge className={`${getPriorityColor(task.priority)} text-xs rounded-full border`}>
                          {task.priority}
                        </Badge>
                      </div>
                      
                      {task.description && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span className="truncate">{task.assigned_user?.full_name || 'Unassigned'}</span>
                        </div>
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {TimeUtils.formatDate(task.due_date, 'MMM d')}
                          </div>
                        )}
                      </div>

                      {status !== 'completed' && (
                        <div className="flex gap-2 mt-3">
                          {status === 'todo' && (
                            <button
                              onClick={() => handleStatusChange(task.id, 'in_progress')}
                              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-b from-green-400 to-green-600 border border-green-600 rounded-lg shadow-lg hover:from-green-500 hover:to-green-700 hover:shadow-xl active:scale-95 transition-all duration-150 transform hover:-translate-y-0.5"
                            >
                              Start
                            </button>
                          )}
                          {status === 'in_progress' && (
                            <button
                              onClick={() => handleStatusChange(task.id, 'completed')}
                              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-b from-red-400 to-red-600 border border-red-600 rounded-lg shadow-lg hover:from-red-500 hover:to-red-700 hover:shadow-xl active:scale-95 transition-all duration-150 transform hover:-translate-y-0.5"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {statusTasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckSquare className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-xs">No {getStatusDisplayName(status).toLowerCase()} tasks</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <CheckSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm">No tasks yet. Tap + to create your first task.</p>
          <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        </div>
      )}

      <CreateTaskDialog 
        open={showCreateDialog} 
        onClose={() => setShowCreateDialog(false)} 
        caseId={caseId}
      />
    </div>
  );
};