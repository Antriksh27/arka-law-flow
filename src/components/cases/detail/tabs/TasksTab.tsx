import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface TasksTabProps {
  caseId: string;
}

export const TasksTab: React.FC<TasksTabProps> = ({ caseId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['case-tasks', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, profiles!tasks_created_by_fkey(full_name)')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const createTask = useMutation({
    mutationFn: async () => {
      const user = await supabase.auth.getUser();
      const { error } = await supabase
        .from('tasks')
        .insert({
          case_id: caseId,
          title,
          description: description || null,
          due_date: dueDate || null,
          status: 'todo',
          created_by: user.data.user?.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-tasks', caseId] });
      setTitle('');
      setDescription('');
      setDueDate('');
      toast.success('Task created successfully');
    },
    onError: () => {
      toast.error('Failed to create task');
    }
  });

  const toggleTaskStatus = useMutation({
    mutationFn: async ({ taskId, currentStatus }: { taskId: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-tasks', caseId] });
      toast.success('Task status updated');
    },
    onError: () => {
      toast.error('Failed to update task status');
    }
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-tasks', caseId] });
      toast.success('Task deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete task');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a task title');
      return;
    }
    createTask.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Create Task Form */}
      <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-muted/30 rounded-lg">
        <h3 className="text-lg font-semibold">Add New Task</h3>
        <Input
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          placeholder="Task description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <Button type="submit" disabled={createTask.isPending}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </form>

      {/* Tasks List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        ) : tasks && tasks.length > 0 ? (
          tasks.map((task: any) => (
            <div key={task.id} className="p-4 border border-border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => toggleTaskStatus.mutate({ taskId: task.id, currentStatus: task.status })}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                  <h4 className={`font-semibold ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </h4>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTask.mutate(task.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              {task.description && (
                <p className="text-sm text-muted-foreground mb-2 ml-8">{task.description}</p>
              )}
              {task.due_date && (
                <div className="text-sm text-muted-foreground mb-2 ml-8">
                  Due: {format(new Date(task.due_date), 'dd/MM/yyyy')}
                </div>
              )}
              <div className="text-xs text-muted-foreground ml-8">
                {task.profiles?.full_name || 'Unknown'} • {format(new Date(task.created_at), 'dd/MM/yyyy HH:mm')}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No tasks yet. Add your first task above.</p>
          </div>
        )}
      </div>
    </div>
  );
};
