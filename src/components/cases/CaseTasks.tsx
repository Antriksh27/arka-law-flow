
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Plus, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface CaseTasksProps {
  caseId: string;
}

export const CaseTasks: React.FC<CaseTasksProps> = ({ caseId }) => {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['case-tasks', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles!tasks_assigned_to_fkey(full_name),
          creator:profiles!tasks_created_by_fkey(full_name)
        `)
        .eq('matter_id', caseId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const tasksByStatus = {
    pending: tasks?.filter(task => task.status === 'pending') || [],
    in_progress: tasks?.filter(task => task.status === 'in_progress') || [],
    completed: tasks?.filter(task => task.status === 'completed') || []
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading tasks...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tasks</h3>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {tasks && tasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <Card key={status} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  {status.replace('_', ' ')} ({statusTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {statusTasks.map((task) => (
                  <div key={task.id} className="bg-gray-50 rounded-lg p-3 border">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm text-gray-900">{task.title}</h4>
                      <Badge className={`${getPriorityColor(task.priority)} text-xs rounded-full`}>
                        {task.priority}
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {task.profiles?.full_name || 'Unassigned'}
                      </div>
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(task.due_date), 'MMM d')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {statusTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <CheckSquare className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs">No {status.replace('_', ' ')} tasks</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No tasks created yet</p>
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create First Task
          </Button>
        </div>
      )}
    </div>
  );
};
