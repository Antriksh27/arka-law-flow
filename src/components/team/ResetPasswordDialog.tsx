import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KeyRound, ExternalLink, Copy, Shield } from 'lucide-react';
import { useContext } from 'react';
import { DialogContentContext, useDialog } from '@/hooks/use-dialog';
import { MobileDialogHeader } from '@/components/ui/mobile-dialog-header';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: any;
}

const ResetPasswordDialog = ({ open, onOpenChange, member }: ResetPasswordDialogProps) => {
  const { role: userRole } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const { closeDialog } = useDialog();
  const isInsideDialog = useContext(DialogContentContext);
  const handleClose = isInsideDialog ? closeDialog : () => onOpenChange?.(false);

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

  const fullFormView = (
    <div className="flex flex-col h-full bg-slate-50">
      <MobileDialogHeader
        title="Reset Password"
        subtitle={`Password reset for ${member.full_name}`}
        onClose={handleClose}
        icon={<KeyRound className="w-5 h-5 text-primary" />}
        showBorder
      />

      <ScrollArea className="flex-1">
        <div className="px-4 py-6 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-border/50 p-5 space-y-4">
            <p className="text-sm text-slate-700 leading-relaxed">
              To reset a team member's password, you need to do this directly in Supabase:
            </p>
            
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <ol className="text-[13px] text-slate-600 space-y-3 list-decimal list-inside font-medium">
                <li>Open the <span className="text-primary font-bold">Supabase Dashboard</span> using the link below</li>
                <li>Navigate to <span className="font-bold text-slate-900">Authentication → Users</span></li>
                <li>Search for <span className="font-bold text-slate-900">{member.full_name}</span></li>
                <li>Click the <span className="font-bold text-slate-900">⋮</span> menu and select <span className="font-bold text-slate-900">Send password recovery</span></li>
              </ol>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider px-1">Member Email</p>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                <span className="text-sm font-mono text-slate-700 truncate flex-1">{member.email}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleCopyEmail}
                  className="h-8 w-8 rounded-lg text-slate-400 group-hover:text-primary transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex gap-3">
            <Shield className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-blue-900">Security Requirement</p>
              <p className="text-[11px] text-blue-800/70 mt-0.5 font-medium leading-relaxed">
                Password recovery must be triggered manually by an administrator for security compliance.
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Standardized Footer */}
      <div className="px-6 py-4 border-t border-slate-100 bg-white shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex gap-3">
          <Button 
            onClick={handleOpenSupabase}
            className="flex-1 rounded-full h-12 font-bold shadow-lg"
          >
            <ExternalLink className="w-4 h-4 mr-2" /> Open Supabase Dashboard
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
      <DialogContent hideCloseButton className="sm:max-w-[450px] p-0 gap-0 overflow-hidden max-h-[85vh] rounded-3xl">
        {fullFormView}
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordDialog;
