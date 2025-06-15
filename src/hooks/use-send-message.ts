
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { type MessageWithSender } from '@/hooks/use-messages';

export const useSendMessage = (threadId: string | null) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (messageText: string) => {
      if (!threadId || !user) {
        throw new Error('User or thread not available');
      }
      
      const { error } = await supabase
        .from('messages')
        .insert({
          thread_id: threadId,
          sender_id: user.id,
          message_text: messageText,
        });

      if (error) {
        throw error;
      }
    },
    onMutate: async (newMessageText: string) => {
      if (!user || !threadId) return;
      const queryKey = ['messages', threadId];

      await queryClient.cancelQueries({ queryKey });

      const previousMessages = queryClient.getQueryData<MessageWithSender[]>(queryKey);

      const optimisticMessage: MessageWithSender = {
        id: `optimistic-${Date.now()}`,
        created_at: new Date().toISOString(),
        message_text: newMessageText,
        sender_id: user.id,
        thread_id: threadId,
        attachments: null,
      };

      queryClient.setQueryData<MessageWithSender[]>(queryKey, (old = []) => [...old, optimisticMessage]);

      return { previousMessages };
    },
    onError: (err, newMessage, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', threadId], context.previousMessages);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', threadId] });
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });
};
