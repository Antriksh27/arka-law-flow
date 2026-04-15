import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { useContext } from 'react';
import { DialogContentContext, useDialog } from '@/hooks/use-dialog';
import { MobileDialogHeader } from '@/components/ui/mobile-dialog-header';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DeleteTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: any;
}

const DeleteTeamMemberDialog = ({ open, onOpenChange, member }: DeleteTeamMemberDialogProps) => {
  const { role: userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const { closeDialog } = useDialog();
  const isInsideDialog = useContext(DialogContentContext);
  const handleClose = isInsideDialog ? closeDialog : () => onOpenChange?.(false);

  const deleteTeamMemberMutation = useMutation({
    mutationFn: async () => {
      setIsDeleting(true);
      
      try {
        const { error } = await supabase
          .from('team_members')
          .delete()
          .eq('id', member.id);

        if (error) throw error;
        return true;
      } finally {
        setIsDeleting(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: "Success",
        description: "Team member has been permanently deleted.",
      });
      handleClose();
    },
    onError: (error: Error) => {
      console.error('Error deleting team member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete team member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    const canDeleteMembers = userRole === 'admin';
    if (!canDeleteMembers) {
      toast({
        title: "Access Denied",
        description: "Only administrators can remove team members.",
        variant: "destructive",
      });
      return;
    }
    deleteTeamMemberMutation.mutate();
  };

  const canDeleteMembers = userRole === 'admin';

  if (!canDeleteMembers || !member) {
    return null;
  }

  const fullFormView = (
    <div className="flex flex-col h-full bg-slate-50">
      <MobileDialogHeader
        title="Delete Team Member"
        subtitle="This action is permanent and cannot be undone."
        onClose={handleClose}
        icon={<Trash2 className="w-5 h-5 text-red-500" />}
        showBorder
      />

      <ScrollArea className="flex-1">
        <div className="px-4 py-6 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-border/50">
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Are you sure you want to permanently delete <strong>{member.full_name}</strong>? 
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2 font-medium">
                    This will remove all their data from the system and cannot be reversed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Standardized Footer */}
      <div className="px-6 py-4 border-t border-slate-100 bg-white shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex gap-3">
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 rounded-full h-12 font-bold shadow-lg"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Permanently'
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent hideCloseButton className="sm:max-w-[400px] p-0 gap-0 overflow-hidden max-h-[85vh] rounded-3xl">
        {fullFormView}
      </DialogContent>
    </Dialog>
  );
};

export default DeleteTeamMemberDialog;
