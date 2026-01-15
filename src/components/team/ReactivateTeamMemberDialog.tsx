import { useState } from 'react';
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
import { UserCheck } from 'lucide-react';

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
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <DialogTitle>Reactivate Team Member</DialogTitle>
              <DialogDescription>
                Restore access for this team member
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to reactivate <strong>{member.full_name}</strong>? 
            They will regain access to the system immediately.
          </p>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isReactivating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReactivate}
            disabled={isReactivating}
            className="bg-green-600 hover:bg-green-700"
          >
            {isReactivating ? 'Reactivating...' : 'Reactivate Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReactivateTeamMemberDialog;
