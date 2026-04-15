import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2, X, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useContext } from 'react';
import { DialogContentContext, useDialog } from '@/hooks/use-dialog';
import { MobileDialogHeader } from '@/components/ui/mobile-dialog-header';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DeleteAllCasesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteAllCasesDialog = ({ open, onOpenChange }: DeleteAllCasesDialogProps) => {
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { closeDialog } = useDialog();
  const isInsideDialog = useContext(DialogContentContext);
  const handleClose = isInsideDialog ? closeDialog : () => onOpenChange?.(false);

  const handleDelete = async () => {
    if (confirmation !== 'DELETE_ALL_CASES') {
      toast.error('Please type the confirmation text exactly');
      return;
    }
    setIsDeleting(true);
    try {
      const batchSize = 100;
      let totalDeleted = 0;
      let hasMore = true;
      let iteration = 0;

      toast.message('Starting deletion', {
        description: 'Processing cases in batches…'
      });

      while (hasMore && iteration < 200) {
        const { data, error } = await supabase.functions.invoke('delete-all-cases', {
          body: {
            confirmation,
            batch_size: batchSize
          }
        });

        if (error) throw error;
        totalDeleted += data?.processed || 0;
        hasMore = !!data?.has_more;
        iteration += 1;

        toast.message('Deleting…', {
          description: `Deleted ${totalDeleted} so far${hasMore ? ' (continuing)…' : ''}`,
          duration: 1500
        });

        if (hasMore) await new Promise(r => setTimeout(r, 250));
      }

      toast.success('Deletion complete', {
        description: `Total cases deleted: ${totalDeleted}`
      });
      handleClose();
      setConfirmation('');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error: any) {
      console.error('Error deleting cases:', error);
      toast.error('Failed to delete cases', {
        description: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const fullFormView = (
    <div className="flex flex-col h-full bg-slate-50">
      <MobileDialogHeader
        title="Delete All Cases"
        subtitle="This action is permanent and cannot be undone."
        onClose={handleClose}
        icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
        showBorder
      />

      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-4">
          {/* Warning Card */}
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-800">This action cannot be undone!</p>
                <p className="text-xs text-red-700 mt-1">
                  This will permanently delete all cases and related data.
                </p>
              </div>
            </div>
          </div>

          {/* What Will Be Deleted Card */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-border/50">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Will Be Deleted</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Permanently removed</p>
                </div>
              </div>
              <ul className="space-y-2 text-[11px] text-slate-600 font-medium">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  All cases in your firm
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  Case documents, hearings, orders, objections
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  Case notes, contacts, and activities
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  Case fetch queue and history
                </li>
              </ul>
            </div>
          </div>

          {/* What Will Be Preserved Card */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-border/50">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Will Be Preserved</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Unaffected data</p>
                </div>
              </div>
              <ul className="space-y-2 text-[11px] text-slate-600 font-medium">
                <li className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Clients
                </li>
                <li className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Appointments
                </li>
                <li className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Tasks
                </li>
                <li className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Documents
                </li>
                <li className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Audit Logs
                </li>
              </ul>
            </div>
          </div>

          {/* Confirmation Input Card */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-border/50">
            <div className="p-4 space-y-3">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Type <span className="font-mono bg-red-50 px-1.5 py-0.5 rounded text-red-600">DELETE_ALL_CASES</span> to confirm
              </Label>
              <Input 
                value={confirmation} 
                onChange={e => setConfirmation(e.target.value)} 
                placeholder="DELETE_ALL_CASES" 
                className="bg-slate-50 border-0 rounded-xl h-12 font-mono"
                disabled={isDeleting} 
              />
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 bg-white/80 backdrop-blur-lg border-t border-slate-100 flex gap-3">
        <Button 
          variant="outline" 
          onClick={handleClose} 
          disabled={isDeleting}
          className="flex-1 rounded-full h-12 font-semibold text-slate-600 border-slate-200 hover:bg-slate-50"
        >
          Cancel
        </Button>
        <Button 
          variant="destructive" 
          onClick={handleDelete} 
          disabled={confirmation !== 'DELETE_ALL_CASES' || isDeleting}
          className="flex-[1.5] rounded-full h-12 font-bold shadow-lg"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Delete All Cases'}
        </Button>
      </div>
    </div>
  );

  if (isInsideDialog) {
    return fullFormView;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent hideCloseButton className="sm:max-w-lg p-0 gap-0 overflow-hidden max-h-[90vh] rounded-3xl">
        {fullFormView}
      </DialogContent>
    </Dialog>
  );
};
