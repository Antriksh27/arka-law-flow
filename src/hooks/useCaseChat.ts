import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCaseChat = (caseId: string | undefined) => {
  return useQuery({
    queryKey: ['case-thread', caseId],
    queryFn: async () => {
      if (!caseId) throw new Error('Case ID is required');

      // Call the RPC function to get or create the thread
      const { data: threadId, error: rpcError } = await supabase
        .rpc('create_case_thread', { p_case_id: caseId });

      if (rpcError) {
        console.error('Error creating/fetching case thread:', rpcError);
        throw rpcError;
      }

      if (!threadId) {
        throw new Error('Failed to create or fetch case thread');
      }

      // Fetch thread details
      const { data: threadData, error: threadError } = await supabase
        .from('message_threads')
        .select('id, title, is_private, related_case_id')
        .eq('id', threadId)
        .single();

      if (threadError) {
        console.error('Error fetching thread data:', threadError);
        throw threadError;
      }

      return {
        threadId,
        threadData: {
          id: threadData.id,
          title: threadData.title,
          is_private: threadData.is_private,
          related_case_id: threadData.related_case_id,
          otherParticipants: []
        }
      };
    },
    enabled: !!caseId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
