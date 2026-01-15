import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KeyRound } from 'lucide-react';

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: any;
}

const ResetPasswordDialog = ({ open, onOpenChange, member }: ResetPasswordDialogProps) => {
  const { role: userRole } = useAuth();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetPassword = async () => {
    const canResetPassword = userRole === 'admin';
    if (!canResetPassword) {
      toast({
        title: "Access Denied",
        description: "Only administrators can reset passwords.",
        variant: "destructive",
      });
      return;
    }

    if (!member?.user_id) {
      toast({
        title: "Error",
        description: "Unable to identify the user. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/reset-team-member-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session?.access_token}`,
          },
          body: JSON.stringify({
            user_id: member.user_id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
      }

      toast({
        title: "Password Reset",
        description: `Password for ${member.full_name} has been reset to the default value.`,
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const canResetPassword = userRole === 'admin';

  if (!canResetPassword || !member) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Reset password to default value
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to reset the password for <strong>{member.full_name}</strong>? 
            Their password will be set to the default value: <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">Hrulegal@711</code>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Please inform the team member of their new password so they can log in.
          </p>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isResetting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleResetPassword}
            disabled={isResetting}
          >
            {isResetting ? 'Resetting...' : 'Reset Password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordDialog;
