import React, { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, Tag, Clock, FileText, Edit, Trash2, Bell, Briefcase, Users } from 'lucide-react';
import { TimeUtils } from '@/lib/timeUtils';
import { supabase } from '@/integrations/supabase/client';
import { TaskComments } from './TaskComments';
import { TaskAttachments } from './TaskAttachments';
import { TaskTimeline } from './TaskTimeline';
import { DialogContentContext } from '@/hooks/use-dialog';
import { MobileDialogHeader } from '@/components/ui/mobile-dialog-header';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const isInsideDialog = useContext(DialogContentContext);

  const {
    data: taskData,
    isLoading
  } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const {
        data: task,
        error
      } = await supabase.from('tasks').select(`
          *,
          case:cases!tasks_case_id_fkey(case_title),
          client:clients!tasks_client_id_fkey(full_name)
        `).eq('id', taskId).single();
      if (error) throw error;
      const userIds = [task.created_by, task.assigned_to].filter(Boolean);
      if (userIds.length > 0) {
        const {
          data: members
        } = await supabase.from('team_members').select('user_id, full_name').in('user_id', userIds);
        const memberMap: Record<string, string> = {};
        (members || []).forEach(m => {
          if (m.user_id) memberMap[m.user_id] = m.full_name;
        });
        return {
          ...task,
          creator: task.created_by ? {
            full_name: memberMap[task.created_by]
          } : null,
          assigned_user: task.assigned_to ? {
            full_name: memberMap[task.assigned_to]
          } : null
        } as any;
      }
      return {
        ...task,
        creator: null,
        assigned_user: null
      } as any;
    },
    enabled: open && !!taskId
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'in_progress':
        return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && taskData?.status !== 'completed';
  };

  const fullView = (
    <div className="flex flex-col h-full bg-slate-50">
      {!isInsideDialog && (
        <MobileDialogHeader
          title="Task Details"
          subtitle={taskData?.title || 'Loading task...'}
          onClose={onClose}
          icon={<FileText className="w-5 h-5 text-sky-500" />}
          showBorder
        />
      )}

      {isInsideDialog && (
        <div className="px-4 py-3 border-b flex items-center gap-3 bg-white">
          <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
            <FileText className="w-4 h-4 text-sky-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Task Details</h2>
            <p className="text-xs text-muted-foreground">{taskData?.title || 'Loading task...'}</p>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="px-4 py-4 pb-32 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-pulse text-slate-500">Loading task details...</div>
            </div>
          ) : !taskData ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-slate-500">Task not found</div>
            </div>
          ) : (
            <>
              {/* Title and Badges */}
              <div className="bg-white rounded-2xl shadow-sm p-4 border border-border/50">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">{taskData.title}</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge className={`${getStatusColor(taskData.status)} text-xs rounded-full border px-2.5 py-0.5 font-medium`}>
                    {taskData.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={`${getPriorityColor(taskData.priority)} text-xs rounded-full border px-2.5 py-0.5 font-medium`}>
                    {taskData.priority}
                  </Badge>
                  {isOverdue(taskData.due_date) && (
                    <Badge className="bg-red-100 text-red-700 border-red-200 text-xs rounded-full border px-2.5 py-0.5 font-medium">
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>

              {/* Description */}
              {taskData.description && (
                <div className="bg-white rounded-2xl shadow-sm p-4 border border-border/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-sky-500" />
                    </div>
                    <span className="font-medium text-slate-700">Description</span>
                  </div>
                  <p className="text-sm text-slate-600 pl-11">{taskData.description}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="bg-white rounded-2xl shadow-sm p-4 border border-border/50 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                      <User className="w-4 h-4 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Assigned To</p>
                      <p className="text-sm font-medium text-slate-800">
                        {taskData.assigned_user?.full_name || 'Unassigned'}
                      </p>
                    </div>
                  </div>

                  {taskData.due_date && (
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isOverdue(taskData.due_date) ? 'bg-red-50' : 'bg-amber-50'}`}>
                        <Calendar className={`w-4 h-4 ${isOverdue(taskData.due_date) ? 'text-red-500' : 'text-amber-500'}`} />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Due Date</p>
                        <p className={`text-sm font-medium ${isOverdue(taskData.due_date) ? 'text-red-700' : 'text-slate-800'}`}>
                          {TimeUtils.formatDate(taskData.due_date)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Users className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Created By</p>
                      <p className="text-sm font-medium text-slate-800">
                        {taskData.creator?.full_name || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Created</p>
                      <p className="text-sm font-medium text-slate-800">
                        {TimeUtils.formatDateTime(taskData.created_at, 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Linked Case/Client */}
              {(taskData.case || taskData.client) && (
                <div className="bg-white rounded-2xl shadow-sm p-4 border border-border/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-rose-500" />
                    </div>
                    <span className="font-medium text-slate-700">Linked Info</span>
                  </div>
                  <div className="space-y-3">
                    {taskData.case && (
                      <div className="flex items-center gap-3 bg-sky-50/50 rounded-xl p-3 border border-sky-100">
                        <FileText className="w-4 h-4 text-sky-500" />
                        <div>
                          <p className="text-[10px] text-sky-600 uppercase font-bold tracking-tight">Case</p>
                          <p className="text-sm font-medium text-sky-900 leading-tight">{taskData.case.case_title}</p>
                        </div>
                      </div>
                    )}
                    {taskData.client && (
                      <div className="flex items-center gap-3 bg-emerald-50/50 rounded-xl p-3 border border-emerald-100">
                        <User className="w-4 h-4 text-emerald-500" />
                        <div>
                          <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-tight">Client</p>
                          <p className="text-sm font-medium text-emerald-900 leading-tight">{taskData.client.full_name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {taskData.tags && taskData.tags.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-4 border border-border/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                      <Tag className="w-4 h-4 text-slate-600" />
                    </div>
                    <span className="font-medium text-slate-700">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {taskData.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-slate-50 rounded-full px-3 py-0.5 border-slate-200">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <TaskAttachments taskId={taskId} attachments={((taskData as any).attachments || []) as string[]} />
              <TaskComments taskId={taskId} comments={((taskData as any).comments || []) as any[]} />
              <TaskTimeline taskId={taskId} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Standardized Footer */}
      <div className="px-6 py-4 border-t border-slate-100 bg-white shadow-[0_-1px_3px_rgba(0,0,0,0.05)] sticky bottom-0 z-50">
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => onEdit(taskId)} 
            className="flex-1 rounded-full h-12 border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold shadow-sm"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Task
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onDelete(taskId)} 
            className="flex-1 rounded-full h-12 border-red-100 text-red-600 hover:bg-red-50 font-semibold shadow-sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );

  if (isInsideDialog) {
    return fullView;
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent hideCloseButton className="sm:max-w-3xl p-0 gap-0 overflow-hidden max-h-[90vh]">
        {fullView}
      </DialogContent>
    </Dialog>
  );
};
