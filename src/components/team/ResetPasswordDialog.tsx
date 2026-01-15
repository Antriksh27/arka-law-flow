import { useState } from 'react';
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
import { KeyRound, ExternalLink, Copy } from 'lucide-react';

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: any;
}

const ResetPasswordDialog = ({ open, onOpenChange, member }: ResetPasswordDialogProps) => {
  const { role: userRole } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    if (member?.email) {
      navigator.clipboard.writeText(member.email);
      setCopied(true);
      toast({
        title: "Copied",
        description: "Email address copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenSupabase = () => {
    window.open('https://supabase.com/dashboard/project/hpcnipcbymruvsnqrmjx/auth/users', '_blank');
  };

  const canResetPassword = userRole === 'admin';

  if (!canResetPassword || !member) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Reset password for {member.full_name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            To reset a team member's password, you need to do this directly in Supabase:
          </p>
          
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Open the Supabase Dashboard (link below)</li>
            <li>Go to <strong>Authentication → Users</strong></li>
            <li>Find <strong>{member.full_name}</strong> ({member.email})</li>
            <li>Click the <strong>⋮</strong> menu → <strong>Send password recovery</strong></li>
          </ol>

          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <span className="text-sm font-mono truncate flex-1">{member.email}</span>
            <Button variant="ghost" size="sm" onClick={handleCopyEmail}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
          <Button 
            onClick={handleOpenSupabase}
            className="w-full sm:w-auto"
          >
            <ExternalLink className="w-4 h-4 mr-2" /> Open Supabase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordDialog;
