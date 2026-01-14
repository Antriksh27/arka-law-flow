import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const BATCH_SIZE = 200;

export function useEnableAutoFetchPending() {
  const { toast } = useToast();
  const { firmId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!firmId) throw new Error('No firm ID found');

      let totalUpdated = 0;

      // Batch to avoid statement timeouts on large firms
      // 1) select a small set of IDs
      // 2) update by IDs
      // repeat until none left
      // Note: requires UPDATE permission by RLS for the current user.
      while (true) {
        const { data: rows, error: selectError } = await supabase
          .from('cases')
          .select('id')
          .eq('firm_id', firmId)
          .eq('status', 'pending')
          .not('cnr_number', 'is', null)
          .neq('cnr_number', '')
          .eq('cnr_auto_fetch_enabled', false)
          .limit(BATCH_SIZE);

        if (selectError) throw new Error(selectError.message);

        const ids = (rows ?? []).map((r) => r.id);
        if (ids.length === 0) break;

        const { error: updateError } = await supabase
          .from('cases')
          .update({ cnr_auto_fetch_enabled: true })
          .in('id', ids);

        if (updateError) throw new Error(updateError.message);

        totalUpdated += ids.length;

        // Small pause to keep the UI responsive and reduce back-to-back load
        await new Promise((r) => setTimeout(r, 50));
      }

      return { updatedCount: totalUpdated };
    },
    onSuccess: (data) => {
      toast({
        title: 'Auto-fetch enabled',
        description: `Enabled auto-fetch for ${data.updatedCount} pending cases with CNRs`,
      });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['stale-cases'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to enable auto-fetch for pending cases',
        variant: 'destructive',
      });
    },
  });
}

