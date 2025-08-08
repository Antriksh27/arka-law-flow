
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ListTodo, Calendar, User, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CreateTaskDialog } from '../tasks/CreateTaskDialog';

interface ClientTasksProps {
  clientId: string;
}

export const ClientTasks: React.FC<ClientTasksProps> = ({ clientId }) => {
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['client-tasks', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(full_name)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading tasks...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (<>
    <Card className="bg-white rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Tasks</CardTitle>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ListTodo className="w-8 h-8 mx-auto mb-2" />
            No tasks assigned to this client
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-4 hover:bg-gray-50 space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{task.title}</span>
                    <Badge className={`${getStatusColor(task.status)} text-xs px-2 ml-1 rounded-full`}>{task.status?.replace('_', ' ')}</Badge>
                    <Badge className={`${getPriorityColor(task.priority)} text-xs px-2 rounded-full`}>{task.priority}</Badge>
                  </div>
                </div>
                {task.description && (
                  <div className="text-gray-600 text-sm mb-1 line-clamp-2">{task.description}</div>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {task.assigned_user?.full_name || 'Unassigned'}
                  </div>
                  {task.due_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    <CreateTaskDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} clientId={clientId} />
  </>);
};
