import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, CheckSquare, Trash2, Edit, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { EditTaskDialog } from '@/components/tasks/EditTaskDialog';

interface TasksTabProps {
  caseId: string;
}

export const TasksTab: React.FC<TasksTabProps> = ({ caseId }) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['case-tasks', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, assigned_user:profiles!tasks_assigned_to_fkey(full_name)')
        .eq('case_id', caseId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return (data || []) as any[];
    }
  });

  const deleteMutation = useMutation({
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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: any }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status: status as any })
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-tasks', caseId] });
      toast.success('Task status updated');
    }
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'todo': 'bg-[#E5E7EB] text-[#6B7280]',
      'in_progress': 'bg-[#E0E7FF] text-[#1E3A8A]',
      'completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || colors.todo;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-blue-100 text-blue-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.medium;
  };

  if (isLoading) {
    return <div className="text-center py-8 text-[#6B7280]">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[#111827]">Case Tasks</h3>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {tasks && tasks.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-[#F9FAFB]">
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <CheckSquare className="w-5 h-5 text-[#1E3A8A] mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-[#111827]">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6B7280]">
                      {task.assigned_user?.full_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6B7280]">
                      {task.due_date ? (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {format(new Date(task.due_date), 'MMM dd, yyyy')}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={task.status}
                        onChange={(e) => updateStatusMutation.mutate({ 
                          taskId: task.id, 
                          status: e.target.value 
                        })}
                        className="text-sm border border-[#E5E7EB] rounded-lg px-2 py-1"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingTask(task)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(task.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-[#E5E7EB]">
          <CheckSquare className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
          <p className="text-[#6B7280] mb-4">No tasks yet</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Task
          </Button>
        </div>
      )}

      {showCreateDialog && (
        <CreateTaskDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          caseId={caseId}
        />
      )}

      {editingTask && (
        <EditTaskDialog
          taskId={editingTask.id}
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
};
