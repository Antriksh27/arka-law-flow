import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Briefcase } from 'lucide-react';
import React from 'react';

// A helper to format the timestamp
const formatTimestamp = (timestamp: string | null | undefined): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays}d ago`;
};


export const useThreads = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['threads', user?.id],
    queryFn: async () => {
      if (!user) return { directMessages: [], caseChannels: [] };

      const { data, error } = await supabase
        .from('message_threads')
        .select(`
          id,
          title,
          is_private,
          related_case_id,
          messages (
            message_text,
            created_at
          ),
          thread_participants (
            user_id
          )
        `)
        .order('created_at', { foreignTable: 'messages', ascending: false, nullsFirst: false });

      if (error) {
        console.error('Error fetching threads:', error);
        throw error;
      }
      
      const allParticipantUserIds = data.flatMap(thread => thread.thread_participants.map(p => p.user_id));
      const uniqueUserIds = [...new Set(allParticipantUserIds)];

      let profilesMap = new Map();
      if (uniqueUserIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, profile_pic, role')
          .in('id', uniqueUserIds);
        
        if (profilesError) {
            console.error('Error fetching profiles for threads:', profilesError);
            throw profilesError;
        }
        profilesMap = new Map((profiles || []).map(p => [p.id, p]));
      }

      const processedThreads = data.map(thread => {
        const lastMessage = thread.messages.length > 0 ? thread.messages[0] : null;
        
        const participantProfiles = thread.thread_participants
            .map(p => profilesMap.get(p.user_id))
            .filter((p): p is NonNullable<typeof p> => p !== null && p !== undefined);

        const otherParticipants = participantProfiles
          .filter(p => p.id !== user.id);

        const isPrivate = thread.is_private;
        
        let title = thread.title;
        let avatar: string | React.ReactNode = <Briefcase className="w-10 h-10 p-2 bg-gray-200 rounded-full" />;

        if (isPrivate) {
            if (otherParticipants.length > 0 && otherParticipants[0]) {
                title = otherParticipants.map(p => p.full_name).join(', ');
                avatar = otherParticipants[0].profile_pic || '';
            } else {
                // It's a chat with only the current user.
                const currentUserProfile = profilesMap.get(user.id);
                title = currentUserProfile?.full_name || 'Yourself';
                avatar = currentUserProfile?.profile_pic || '';
            }
        }

        return {
          id: thread.id,
          title: title || 'Untitled Chat',
          avatar,
          // @ts-ignore - Messages type from Supabase may show depth warnings
          message: lastMessage?.message_text || 'No messages yet.',
          // @ts-ignore - Messages type from Supabase may show depth warnings
          timestamp: formatTimestamp(lastMessage?.created_at),
          is_private: isPrivate,
          related_case_id: thread.related_case_id,
          otherParticipants
        }
      });
      
      const directMessages = processedThreads.filter(t => t.is_private);
      const caseChannels = processedThreads.filter(t => !t.is_private);

      return { directMessages, caseChannels };
    },
    enabled: !!user,
  });

  return query;
};
