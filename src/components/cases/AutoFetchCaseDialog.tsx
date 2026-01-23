import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Settings, Info, X, Zap } from 'lucide-react';

interface AutoFetchCaseDialogProps {
  open: boolean;
  onClose: () => void;
  caseId: string;
  currentAutoFetch?: boolean;
}

export const AutoFetchCaseDialog: React.FC<AutoFetchCaseDialogProps> = ({
  open,
  onClose,
  caseId,
  currentAutoFetch = false,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [autoFetchEnabled, setAutoFetchEnabled] = useState(currentAutoFetch);

  const updateAutoFetchMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from('cases')
        .update({ cnr_auto_fetch_enabled: enabled })
        .eq('id', caseId);

      if (error) throw error;
    },
    onSuccess: (_, enabled) => {
      toast({
        title: "Auto-fetch Updated",
        description: `CNR auto-fetch has been ${enabled ? 'enabled' : 'disabled'} for this case`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateAutoFetchMutation.mutate(autoFetchEnabled);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-full sm:max-w-md h-screen sm:h-auto p-0 bg-slate-50 m-0 sm:m-4 rounded-none sm:rounded-2xl overflow-hidden">
        <div className="flex flex-col h-full sm:h-auto">
          {/* Header */}
          <div className="px-6 py-5 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">Auto-Fetch Settings</h2>
                  <p className="text-sm text-muted-foreground">Configure automatic case fetching</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="md:hidden w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
            {/* Toggle Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700">Enable Auto-Fetch</Label>
                      <p className="text-xs text-muted-foreground">Automatically fetch when CNR changes</p>
                    </div>
                  </div>
                  <Switch
                    checked={autoFetchEnabled}
                    onCheckedChange={setAutoFetchEnabled}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-sky-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-sky-900">How Auto-Fetch Works</h4>
                  <ul className="text-sm text-sky-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" />
                      <span>Triggers when CNR number is added or modified</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" />
                      <span>Searches High Court, District Court, and Supreme Court</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" />
                      <span>Updates case details with fetched information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" />
                      <span>Creates search records for audit trail</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-white border-t border-slate-100">
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="rounded-full px-6 border-slate-200"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updateAutoFetchMutation.isPending}
                className="rounded-full px-6 bg-slate-800 hover:bg-slate-700"
              >
                {updateAutoFetchMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
