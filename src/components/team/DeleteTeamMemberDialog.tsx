import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

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

  const deleteTeamMemberMutation = useMutation({
    mutationFn: async () => {
      setIsDeleting(true);
      
      try {
        // First, update the member status to suspended
        const { error: updateError } = await supabase
          .from('team_members')
          .update({ status: 'suspended' })
          .eq('id', member.id);

        if (updateError) throw updateError;

        // Note: We don't actually delete the record to preserve data integrity
        // The team member is just marked as suspended
        return true;
      } finally {
        setIsDeleting(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: "Success",
        description: "Team member has been suspended and removed from the team.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error('Error deactivating team member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove team member. Please try again.",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Remove Team Member</DialogTitle>
              <DialogDescription>
                This action will deactivate the team member's account.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove <strong>{member.full_name}</strong> from the team? 
            Their account will be suspended and they will no longer have access to the system, but their data will be preserved.
          </p>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Removing...' : 'Remove Team Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteTeamMemberDialog;