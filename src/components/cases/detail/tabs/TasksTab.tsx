import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Plus, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface TasksTabProps {
  caseId: string;
}

export const TasksTab: React.FC<TasksTabProps> = ({ caseId }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['case-tasks', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name)')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('tasks').insert([{
        title: taskDescription.substring(0, 50), // Use first 50 chars as title
        description: taskDescription,
        case_id: caseId,
        due_date: dueDate || null,
        created_by: user.id,
        status: 'todo' as const
      }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-tasks', caseId] });
      setTaskDescription('');
      setDueDate('');
      setIsAdding(false);
      toast.success('Task created successfully');
    },
    onError: () => {
      toast.error('Failed to create task');
    }
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: 'todo' | 'in_progress' | 'completed' }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-tasks', caseId] });
      toast.success('Task updated');
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-tasks', caseId] });
      toast.success('Task deleted');
    }
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      todo: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Case Tasks</h3>
        <Button onClick={() => setIsAdding(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {isAdding && (
        <Card className="p-4 border-2 border-blue-200">
          <Textarea
            placeholder="Task description..."
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            rows={3}
            className="mb-3"
          />
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mb-3"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => createTaskMutation.mutate()}
              disabled={!taskDescription}
              size="sm"
            >
              Create Task
            </Button>
            <Button
              onClick={() => {
                setIsAdding(false);
                setTaskDescription('');
                setDueDate('');
              }}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {tasks && tasks.length > 0 ? (
        <div className="grid gap-4">
          {tasks.map((task: any) => (
            <Card key={task.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={() =>
                      updateTaskStatusMutation.mutate({
                        taskId: task.id,
                        status: task.status === 'completed' ? 'todo' : 'completed'
                      })
                    }
                    className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                      task.status === 'completed'
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 hover:border-green-500'
                    }`}
                  >
                    {task.status === 'completed' && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className={`text-sm ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.description}
                      </p>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {task.due_date && (
                        <>
                          <span>Due: {format(new Date(task.due_date), 'dd MMM yyyy')}</span>
                          <span>•</span>
                        </>
                      )}
                      {task.assigned_to_profile && (
                        <span>Assigned to: {task.assigned_to_profile.full_name}</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTaskMutation.mutate(task.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        !isAdding && (
          <Card className="p-12 text-center">
            <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No tasks yet</p>
            <Button onClick={() => setIsAdding(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add First Task
            </Button>
          </Card>
        )
      )}
    </div>
  );
};
