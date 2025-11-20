import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type MessageReaction = {
  emoji: string;
  count: number;
  users: Array<{ id: string; name: string }>;
  hasUserReacted: boolean;
};

type ReactionData = {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
  };
};

export const useMessageReactions = (messageIds: string[]) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const queryKey = ['message-reactions', messageIds];

  useEffect(() => {
    if (!messageIds.length) return;

    const channel = supabase
      .channel('message-reactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=in.(${messageIds.join(',')})`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageIds.join(','), queryClient, queryKey]);

  return useQuery<Record<string, MessageReaction[]>>({
    queryKey,
    queryFn: async () => {
      if (!messageIds.length) return {};

      const { data, error } = await supabase
        .from('message_reactions')
        .select('id, message_id, user_id, emoji, created_at, profiles:user_id(id, full_name)')
        .in('message_id', messageIds);

      if (error) throw error;

      // Group reactions by message_id and emoji
      const grouped: Record<string, MessageReaction[]> = {};

      (data as unknown as ReactionData[])?.forEach((reaction) => {
        if (!grouped[reaction.message_id]) {
          grouped[reaction.message_id] = [];
        }

        const existingReaction = grouped[reaction.message_id].find(
          (r) => r.emoji === reaction.emoji
        );

        if (existingReaction) {
          existingReaction.count++;
          existingReaction.users.push({
            id: reaction.user_id,
            name: reaction.profiles?.full_name || 'Unknown',
          });
          if (reaction.user_id === user?.id) {
            existingReaction.hasUserReacted = true;
          }
        } else {
          grouped[reaction.message_id].push({
            emoji: reaction.emoji,
            count: 1,
            users: [
              {
                id: reaction.user_id,
                name: reaction.profiles?.full_name || 'Unknown',
              },
            ],
            hasUserReacted: reaction.user_id === user?.id,
          });
        }
      });

      return grouped;
    },
    enabled: messageIds.length > 0,
  });
};
