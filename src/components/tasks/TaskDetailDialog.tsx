import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Tag, Clock, FileText, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface TaskDetailDialogProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({
  open,
  onClose,
  taskId,
  onEdit,
  onDelete
}) => {
  const { data: taskData, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(full_name),
          creator:profiles!tasks_created_by_fkey(full_name),
          case:cases!tasks_case_id_fkey(title),
          client:clients!tasks_client_id_fkey(full_name)
        `)
        .eq('id', taskId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!taskId
  });

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && taskData?.status !== 'completed';
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            Loading task details...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!taskData) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            Task not found
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-lg">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold text-gray-900 mb-2">
                {taskData.title}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${getStatusColor(taskData.status)} text-xs rounded-full border`}>
                  {taskData.status.replace('_', ' ')}
                </Badge>
                <Badge className={`${getPriorityColor(taskData.priority)} text-xs rounded-full border`}>
                  {taskData.priority}
                </Badge>
                {isOverdue(taskData.due_date) && (
                  <Badge className="bg-red-100 text-red-700 border-red-200 text-xs rounded-full border">
                    Overdue
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(taskId)}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(taskId)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Description */}
          {taskData.description && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <h3 className="font-medium text-gray-900">Description</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-700 whitespace-pre-wrap">{taskData.description}</p>
              </div>
            </div>
          )}

          {/* Task Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assigned To */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <h3 className="font-medium text-gray-900">Assigned To</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-gray-700">
                  {taskData.assigned_user?.full_name || 'Unassigned'}
                </p>
              </div>
            </div>

            {/* Created By */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <h3 className="font-medium text-gray-900">Created By</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-gray-700">
                  {taskData.creator?.full_name || 'Unknown'}
                </p>
              </div>
            </div>

            {/* Due Date */}
            {taskData.due_date && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <h3 className="font-medium text-gray-900">Due Date</h3>
                </div>
                <div className={`rounded-lg p-3 border ${isOverdue(taskData.due_date) ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                  <p className={`${isOverdue(taskData.due_date) ? 'text-red-700' : 'text-gray-700'}`}>
                    {format(new Date(taskData.due_date), 'PPP')}
                    {isOverdue(taskData.due_date) && ' (Overdue)'}
                  </p>
                </div>
              </div>
            )}

            {/* Created Date */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <h3 className="font-medium text-gray-900">Created</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-gray-700">
                  {format(new Date(taskData.created_at), 'PPp')}
                </p>
              </div>
            </div>
          </div>

          {/* Linked Case/Client */}
          {(taskData.case || taskData.client) && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Linked To</h3>
              <div className="space-y-2">
                {taskData.case && (
                  <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-700 font-medium">Case:</span>
                    <span className="text-blue-600">{taskData.case.title}</span>
                  </div>
                )}
                {taskData.client && (
                  <div className="flex items-center gap-2 bg-green-50 rounded-lg p-3 border border-green-200">
                    <User className="w-4 h-4 text-green-600" />
                    <span className="text-green-700 font-medium">Client:</span>
                    <span className="text-green-600">{taskData.client.full_name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {taskData.tags && taskData.tags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-500" />
                <h3 className="font-medium text-gray-900">Tags</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {taskData.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline" className="bg-gray-50">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Task Times */}
          {(taskData.start_time || taskData.end_time) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <h3 className="font-medium text-gray-900">Time Tracking</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {taskData.start_time && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Started</p>
                    <p className="text-gray-700">
                      {format(new Date(taskData.start_time), 'PPp')}
                    </p>
                  </div>
                )}
                {taskData.end_time && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Completed</p>
                    <p className="text-gray-700">
                      {format(new Date(taskData.end_time), 'PPp')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Last Updated */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <h3 className="font-medium text-gray-900">Last Updated</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-gray-700">
                {format(new Date(taskData.updated_at), 'PPp')}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};