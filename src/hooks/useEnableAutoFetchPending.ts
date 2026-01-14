import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useEnableAutoFetchPending() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('enable-auto-fetch-pending', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to enable auto-fetch');
      }

      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Auto-fetch enabled',
        description: data.message || `Enabled auto-fetch for ${data.updatedCount} cases`,
      });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
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
