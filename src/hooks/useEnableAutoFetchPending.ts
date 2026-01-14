import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useEnableAutoFetchPending() {
  const { toast } = useToast();
  const { firmId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!firmId) {
        throw new Error('No firm ID found');
      }

      // Update all pending cases with CNRs to enable auto-fetch
      const { data: updatedCases, error, count } = await supabase
        .from('cases')
        .update({ cnr_auto_fetch_enabled: true })
        .eq('firm_id', firmId)
        .eq('status', 'pending')
        .not('cnr_number', 'is', null)
        .neq('cnr_number', '')
        .eq('cnr_auto_fetch_enabled', false)
        .select('id, case_number, cnr_number');

      if (error) {
        throw new Error(error.message || 'Failed to update cases');
      }

      return {
        updatedCount: updatedCases?.length || 0,
        cases: updatedCases,
      };
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
