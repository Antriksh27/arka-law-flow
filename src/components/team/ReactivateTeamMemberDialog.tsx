import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserCheck, Loader2 } from 'lucide-react';
import { useContext } from 'react';
import { DialogContentContext, useDialog } from '@/hooks/use-dialog';
import { MobileDialogHeader } from '@/components/ui/mobile-dialog-header';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ReactivateTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: any;
}

const ReactivateTeamMemberDialog = ({ open, onOpenChange, member }: ReactivateTeamMemberDialogProps) => {
  const { role: userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isReactivating, setIsReactivating] = useState(false);
  const { closeDialog } = useDialog();
  const isInsideDialog = useContext(DialogContentContext);
  const handleClose = isInsideDialog ? closeDialog : () => onOpenChange?.(false);

  const reactivateMutation = useMutation({
    mutationFn: async () => {
      setIsReactivating(true);
      
      try {
        const { error } = await supabase
          .from('team_members')
          .update({ status: 'active' })
          .eq('id', member.id);

        if (error) throw error;
        return true;
      } finally {
        setIsReactivating(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: "Success",
        description: `${member.full_name} has been reactivated.`,
      });
      handleClose();
    },
    onError: (error: Error) => {
      console.error('Error reactivating team member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reactivate team member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleReactivate = () => {
    if (userRole !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Only administrators can reactivate team members.",
        variant: "destructive",
      });
      return;
    }
    reactivateMutation.mutate();
  };

  const canReactivate = userRole === 'admin';

  if (!canReactivate || !member) {
    return null;
  }

  const fullFormView = (
    <div className="flex flex-col h-full bg-slate-50">
      <MobileDialogHeader
        title="Reactivate Member"
        subtitle="Restore access for this team member"
        onClose={handleClose}
        icon={<UserCheck className="w-5 h-5 text-emerald-500" />}
        showBorder
      />

      <ScrollArea className="flex-1">
        <div className="px-4 py-8 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-border/50">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                  <UserCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                    Are you sure you want to reactivate <strong>{member.full_name}</strong>? 
                  </p>
                  <p className="text-[13px] text-slate-500 mt-2 font-medium">
                    They will regain full access to the firm's system immediately after reactivation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                <UserCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xs font-bold text-emerald-800">Ready to restore access</p>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Standardized Footer */}
      <div className="px-6 py-4 border-t border-slate-100 bg-white shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex gap-3">
          <Button 
            onClick={handleReactivate}
            disabled={isReactivating}
            className="flex-1 rounded-full h-12 font-bold shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isReactivating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Reactivating...
              </>
            ) : (
              'Reactivate Member'
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

export default ReactivateTeamMemberDialog;
