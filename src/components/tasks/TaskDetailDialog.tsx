import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, Tag, Clock, FileText, Edit, Trash2, Bell, Briefcase, Users, X } from 'lucide-react';
import { TimeUtils } from '@/lib/timeUtils';
import { supabase } from '@/integrations/supabase/client';
import { TaskComments } from './TaskComments';
import { TaskAttachments } from './TaskAttachments';
import { TaskTimeline } from './TaskTimeline';

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
      const { data: task, error } = await supabase
        .from('tasks')
        .select(`
          *,
          case:cases!tasks_case_id_fkey(case_title),
          client:clients!tasks_client_id_fkey(full_name)
        `)
        .eq('id', taskId)
        .single();
      if (error) throw error;

      const userIds = [task.created_by, task.assigned_to].filter(Boolean);
      if (userIds.length > 0) {
        const { data: members } = await supabase
          .from('team_members')
          .select('user_id, full_name')
          .in('user_id', userIds);
        const memberMap: Record<string, string> = {};
        (members || []).forEach(m => {
          if (m.user_id) memberMap[m.user_id] = m.full_name;
        });
        return {
          ...task,
          creator: task.created_by ? { full_name: memberMap[task.created_by] } : null,
          assigned_user: task.assigned_to ? { full_name: memberMap[task.assigned_to] } : null
        } as any;
      }
      return { ...task, creator: null, assigned_user: null } as any;
    },
    enabled: open && !!taskId
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'in_progress': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && taskData?.status !== 'completed';
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent hideCloseButton className="sm:max-w-3xl p-0 gap-0 overflow-hidden bg-muted">
          <div className="flex items-center justify-center py-16">
            <div className="animate-pulse text-slate-500">Loading task details...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!taskData) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent hideCloseButton className="sm:max-w-3xl p-0 gap-0 overflow-hidden bg-muted">
          <div className="flex items-center justify-center py-16">
            <div className="text-slate-500">Task not found</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent hideCloseButton className="sm:max-w-3xl p-0 gap-0 overflow-hidden">
        <div className="flex flex-col h-full max-h-[90vh] bg-muted">
          {/* Header */}
          <div className="px-6 py-5 bg-white border-b border-slate-100">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  {taskData.title}
                </h2>
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
              <button
                onClick={onClose}
                className="md:hidden w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {/* Description */}
            {taskData.description && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-sky-500" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Description</h3>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap pl-13">{taskData.description}</p>
                </div>
              </div>
            )}

            {/* Task Details Grid */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 space-y-4">
                {/* Assigned To */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                    <User className="w-5 h-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Assigned To</p>
                    <p className="font-medium text-slate-900">
                      {taskData.assigned_user?.full_name || 'Unassigned'}
                    </p>
                  </div>
                </div>

                {/* Created By */}
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Created By</p>
                    <p className="font-medium text-slate-900">
                      {taskData.creator?.full_name || 'Unknown'}
                    </p>
                  </div>
                </div>

                {/* Due Date */}
                {taskData.due_date && (
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOverdue(taskData.due_date) ? 'bg-red-50' : 'bg-amber-50'}`}>
                      <Calendar className={`w-5 h-5 ${isOverdue(taskData.due_date) ? 'text-red-500' : 'text-amber-500'}`} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Due Date</p>
                      <p className={`font-medium ${isOverdue(taskData.due_date) ? 'text-red-700' : 'text-slate-900'}`}>
                        {TimeUtils.formatDate(taskData.due_date)}
                        {isOverdue(taskData.due_date) && ' (Overdue)'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Reminder */}
                {(taskData as any).reminder_time && (
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-sky-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Reminder</p>
                      <p className="font-medium text-slate-900">
                        {TimeUtils.formatDateTime((taskData as any).reminder_time, 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Created Date */}
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Created</p>
                    <p className="font-medium text-slate-900">
                      {TimeUtils.formatDateTime(taskData.created_at, 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Linked Case/Client */}
            {(taskData.case || taskData.client) && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-rose-500" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Linked To</h3>
                  </div>
                  <div className="space-y-2">
                    {taskData.case && (
                      <div className="flex items-center gap-2 bg-sky-50 rounded-xl p-3 border border-sky-100">
                        <FileText className="w-4 h-4 text-sky-600" />
                        <span className="text-sky-700 font-medium">Case:</span>
                        <span className="text-sky-600">{taskData.case.case_title}</span>
                      </div>
                    )}
                    {taskData.client && (
                      <div className="flex items-center gap-2 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                        <User className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700 font-medium">Client:</span>
                        <span className="text-emerald-600">{taskData.client.full_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            {taskData.tags && taskData.tags.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Tag className="w-5 h-5 text-slate-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Tags</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {taskData.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-slate-50 rounded-full">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Separator className="my-4" />

            {/* Attachments */}
            <TaskAttachments taskId={taskId} attachments={((taskData as any).attachments || []) as string[]} />

            <Separator className="my-4" />

            {/* Comments */}
            <TaskComments taskId={taskId} comments={((taskData as any).comments || []) as any[]} />

            <Separator className="my-4" />

            {/* Timeline */}
            <TaskTimeline taskId={taskId} />
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-white border-t border-slate-100">
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => onEdit(taskId)}
                className="rounded-full px-6 border-slate-200 hover:bg-slate-50"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => onDelete(taskId)}
                className="rounded-full px-6 border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
