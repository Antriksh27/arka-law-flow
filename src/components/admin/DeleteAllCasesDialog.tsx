import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2, X, Shield, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeleteAllCasesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteAllCasesDialog = ({ open, onOpenChange }: DeleteAllCasesDialogProps) => {
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden max-h-[90vh]">
        <div className="flex flex-col h-full bg-slate-50">
          {/* Header */}
          <div className="px-6 py-5 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-red-600">Delete All Cases</h2>
                  <p className="text-sm text-muted-foreground">Danger zone action</p>
                </div>
              </div>
              <button 
                onClick={() => onOpenChange(false)}
                className="md:hidden w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {/* Warning Card */}
            <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800">This action cannot be undone!</p>
                  <p className="text-sm text-red-700 mt-1">
                    This will permanently delete all cases and related data.
                  </p>
                </div>
              </div>
            </div>

            {/* What Will Be Deleted Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Will Be Deleted</p>
                    <p className="text-xs text-muted-foreground">Permanently removed</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-slate-600">
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
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Will Be Preserved</p>
                    <p className="text-xs text-muted-foreground">Unaffected data</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Clients
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Appointments
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Tasks
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Documents
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Audit Logs
                  </li>
                </ul>
              </div>
            </div>

            {/* Confirmation Input Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <Label className="text-sm font-semibold text-slate-900">
                  Type <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-red-600">DELETE_ALL_CASES</span> to confirm
                </Label>
                <Input 
                  value={confirmation} 
                  onChange={e => setConfirmation(e.target.value)} 
                  placeholder="DELETE_ALL_CASES" 
                  className="mt-2 bg-slate-50 border-slate-200 rounded-xl h-11 font-mono"
                  disabled={isDeleting} 
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-white border-t border-slate-100">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  onOpenChange(false);
                  setConfirmation('');
                }} 
                disabled={isDeleting}
                className="flex-1 rounded-full"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete} 
                disabled={confirmation !== 'DELETE_ALL_CASES' || isDeleting}
                className="flex-1 rounded-full"
              >
                {isDeleting ? 'Deleting...' : 'Delete All Cases'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
