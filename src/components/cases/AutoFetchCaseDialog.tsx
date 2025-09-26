import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Settings, Info } from 'lucide-react';

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
      
      // Invalidate relevant queries
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            CNR Auto-Fetch Settings
          </DialogTitle>
          <DialogDescription>
            Configure automatic case data fetching when CNR is updated
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-fetch">Enable Auto-Fetch</Label>
              <p className="text-sm text-gray-500">
                Automatically fetch case details from Legalkart when CNR is added or changed
              </p>
            </div>
            <Switch
              id="auto-fetch"
              checked={autoFetchEnabled}
              onCheckedChange={setAutoFetchEnabled}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-blue-900">How Auto-Fetch Works</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Triggers when CNR number is added or modified</li>
                  <li>• Searches High Court, District Court, and Supreme Court</li>
                  <li>• Updates case details with fetched information</li>
                  <li>• Creates search records for audit trail</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateAutoFetchMutation.isPending}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};