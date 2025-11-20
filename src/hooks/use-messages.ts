import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type MessageReaction = {
  emoji: string;
  count: number;
  users: Array<{ id: string; name: string }>;
  hasUserReacted: boolean;
};

export type FileAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
};

export type MessageWithSender = {
  id: string;
  created_at: string;
  message_text: string;
  sender_id: string;
  attachments?: FileAttachment[];
  thread_id: string;
  sender?: {
    id: string;
    full_name: string | null;
    profile_pic: string | null;
  };
  reactions?: MessageReaction[];
};

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

  return useQuery<MessageWithSender[]>({
    queryKey,
    queryFn: async (): Promise<MessageWithSender[]> => {
      if (!threadId) return [];
      
      // Fetch messages and participants in parallel
      const [messagesRes, participantsRes] = await Promise.all([
        supabase
          .from('messages')
          .select('id, created_at, message_text, sender_id, thread_id, attachments')
          .eq('thread_id', threadId)
          .order('created_at', { ascending: true }),
        supabase
          .from('thread_participants')
          .select('user_id')
          .eq('thread_id', threadId)
      ]);
      
      const { data: messagesData, error: messagesError } = messagesRes;
      const { data: participantsData, error: participantsError } = participantsRes;

      if (messagesError) throw messagesError;
      if (participantsError) throw participantsError;

      const userIds = (participantsData || []).map(p => p.user_id);

      if (userIds.length === 0) {
        return (messagesData || []).map(message => ({ 
          ...message, 
          sender: undefined,
          attachments: message.attachments ? (message.attachments as any as FileAttachment[]) : undefined,
        }));
      }
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, profile_pic')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const participantsMap = new Map((profilesData || []).map(p => [p.id, p]));

      return (messagesData || []).map(message => ({
        ...message,
        attachments: message.attachments ? (message.attachments as any as FileAttachment[]) : undefined,
        sender: participantsMap.get(message.sender_id),
      }));
    },
    enabled: !!threadId,
  });
};
