import React, { useContext } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogContent,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { DialogContentContext, useDialog } from '@/hooks/use-dialog';
import { MobileDialogHeader } from '@/components/ui/mobile-dialog-header';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DeleteTaskDialogProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
}

export const DeleteTaskDialog: React.FC<DeleteTaskDialogProps> = ({
  open,
  onClose,
  taskId,
  taskTitle
}) => {
  const { closeDialog } = useDialog();
  const isInsideDialog = useContext(DialogContentContext);
  const handleClose = isInsideDialog ? closeDialog : onClose;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['case-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['client-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      toast({
        title: "Task deleted successfully",
        description: `"${taskTitle}" has been permanently deleted.`
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Task deletion error:', error);
      toast({
        title: "Failed to delete task",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleDelete = () => {
    deleteTaskMutation.mutate();
  };

  const fullFormView = (
    <div className="flex flex-col h-full bg-slate-50">
      <MobileDialogHeader
        title="Delete Task"
        subtitle={taskTitle}
        onClose={handleClose}
        icon={<Trash2 className="w-5 h-5 text-red-500" />}
        showBorder
      />

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-border/50">
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 border border-amber-100">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Are you sure you want to delete the task{' '}
                    <strong className="font-bold text-slate-900">"{taskTitle}"</strong>?
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2 font-medium">
                    Permanently remove all task data including comments, attachments, and timeline history from the system.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="font-bold text-red-800 text-sm">Destructive Action</p>
                <p className="text-[11px] text-red-700 mt-1 font-medium leading-relaxed">
                  This task and its status progress will be lost forever.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Standardized Footer */}
      <div className="px-6 py-4 border-t border-slate-100 bg-white shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteTaskMutation.isPending}
            className="flex-1 rounded-full h-12 font-bold shadow-lg"
          >
            {deleteTaskMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Task'
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  if (isInsideDialog) {
    return fullFormView;
  }

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden max-h-[85vh] rounded-3xl border-0">
        {fullFormView}
      </AlertDialogContent>
    </AlertDialog>
  );
};
