
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useMessages = (threadId: string | null) => {
  const queryClient = useQueryClient();
  const queryKey = ['messages', threadId];

  useEffect(() => {
    if (!threadId) return;

    const channel = supabase
      .channel(`messages-${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, queryClient, queryKey]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!threadId) return [];
      
      // Fetch messages and participants in parallel
      const [messagesRes, participantsRes] = await Promise.all([
        supabase
          .from('messages')
          .select('id, created_at, message_text, sender_id')
          .eq('thread_id', threadId)
          .order('created_at', { ascending: true }),
        supabase
          .from('thread_participants')
          .select('user_id, profiles!user_id(id, full_name, profile_pic)')
          .eq('thread_id', threadId)
      ]);
      
      const { data: messagesData, error: messagesError } = messagesRes;
      const { data: participantsData, error: participantsError } = participantsRes;

      if (messagesError) throw messagesError;
      if (participantsError) throw participantsError;

      const participants = (participantsData || []).map(p => p.profiles).filter(Boolean);
      const participantsMap = new Map(participants.map(p => [p!.id, p!]));

      return messagesData.map(message => ({
        ...message,
        sender: participantsMap.get(message.sender_id),
      }));
    },
    enabled: !!threadId,
  });
};
