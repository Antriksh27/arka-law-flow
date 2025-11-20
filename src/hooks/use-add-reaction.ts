import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useAddReaction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Check if user already reacted with this emoji
      const { data: existing } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .single();

      if (existing) {
        // Remove reaction
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add reaction
        const { error } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji,
          });

        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate reactions query to refetch
      queryClient.invalidateQueries({
        queryKey: ['message-reactions'],
      });
    },
    onError: (error) => {
      console.error('Error toggling reaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to add reaction',
        variant: 'destructive',
      });
    },
  });
};
