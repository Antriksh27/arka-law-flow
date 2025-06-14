import React, { useState, useEffect, useMemo } from 'react';
import { Edit, Search, Paperclip, Phone, Send } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

import DefaultPageLayout from '@/components/messages/ui/DefaultPageLayout';
import { IconButton } from '@/components/messages/ui/IconButton';
import ChatList from '@/components/messages/ui/ChatList';
import ChatHeader from '@/components/messages/ui/ChatHeader';
import TimelineDivider from '@/components/messages/ui/TimelineDivider';
import ChatReceived from '@/components/messages/ui/ChatReceived';
import ChatSent from '@/components/messages/ui/ChatSent';
import { TextFieldUnstyled } from '@/components/messages/ui/TextFieldUnstyled';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { TextField } from '@/components/messages/ui/TextField';

// Types
type Profile = {
  id: string;
  full_name: string;
  profile_pic: string | null;
};

type Participant = {
  profile: Profile | null;
};

type Message = {
  id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
  senderProfile?: Profile;
};

type Thread = {
  id: string;
  title: string | null;
  is_private: boolean;
  participants: Participant[];
  messages: { message_text: string; created_at: string }[];
};

const Messages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  // Fetch threads for the left sidebar
  const { data: threads, isLoading: isLoadingThreads } = useQuery<Thread[]>({
    queryKey: ['threads', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: participantData, error: participantError } = await supabase
        .from('message_thread_participants')
        .select('thread_id')
        .eq('user_id', user.id);

      if (participantError) throw participantError;
      const threadIds = participantData.map(p => p.thread_id);

      const { data: threadsData, error: threadsError } = await supabase
        .from('message_threads')
        .select(`
          id,
          title,
          is_private,
          participants:message_thread_participants(
            profile:profiles(id, full_name, profile_pic)
          ),
          messages (
            message_text,
            created_at
          )
        `)
        .in('id', threadIds)
        .order('created_at', { referencedTable: 'messages', ascending: false })
        .limit(1, { referencedTable: 'messages' });

      if (threadsError) throw threadsError;
      return threadsData || [];
    },
    enabled: !!user,
  });

  // Fetch messages for the selected thread
  const { data: messages, isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ['messages', selectedThreadId],
    queryFn: async () => {
      if (!selectedThreadId) return [];
      const { data, error } = await supabase
        .from('messages')
        .select(`*, senderProfile:profiles(id, full_name, profile_pic)`)
        .eq('thread_id', selectedThreadId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedThreadId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (newMessageText: string) => {
      if (!selectedThreadId || !user) return;
      
      const { error } = await supabase.from('messages').insert({
        thread_id: selectedThreadId,
        sender_id: user.id,
        message_text: newMessageText,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedThreadId] });
      queryClient.invalidateQueries({ queryKey: ['threads', user?.id] });
      setMessage('');
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  useEffect(() => {
    if (!selectedThreadId && threads && threads.length > 0) {
      setSelectedThreadId(threads[0].id);
    }
  }, [threads, selectedThreadId]);

  const selectedThread = useMemo(() => {
    return threads?.find(t => t.id === selectedThreadId);
  }, [threads, selectedThreadId]);

  const getThreadInfo = (thread: Thread) => {
    if (!user) return { name: '', avatar: '' };

    if (thread.is_private) {
      const otherParticipant = thread.participants.find(p => p.profile?.id !== user.id);
      return {
        name: otherParticipant?.profile?.full_name || 'Direct Message',
        avatar: otherParticipant?.profile?.profile_pic || '',
      };
    }
    return {
      name: thread.title || 'Case Channel',
      avatar: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f', // Placeholder for case channels
    };
  };

  return (
    <DefaultPageLayout>
      <div className="flex h-full w-full items-start">
        <div className="hidden md:flex w-80 flex-none flex-col items-start gap-4 self-stretch border-r border-gray-200 bg-white p-4">
          <div className="flex w-full items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">Messages</h1>
            <IconButton variant="brand-tertiary" icon={<Edit className="w-4 h-4" />} />
          </div>
          <TextField className="w-full" variant="filled" icon={<Search className="w-4 h-4" />}>
            <TextField.Input
              placeholder="Search users or cases"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </TextField>
          <div className="flex w-full flex-1 flex-col items-start gap-4 overflow-auto">
            {isLoadingThreads ? (
              <div className="w-full space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : (
              <ChatList>
                {threads?.filter(thread => getThreadInfo(thread).name.toLowerCase().includes(search.toLowerCase())).map(thread => {
                  const info = getThreadInfo(thread);
                  const lastMessage = thread.messages?.[0];
                  return (
                    <div key={thread.id} onClick={() => setSelectedThreadId(thread.id)}>
                      <ChatList.ChatListItem
                        avatar={info.avatar || ''}
                        name={info.name}
                        message={lastMessage?.message_text || 'No messages yet'}
                        timestamp={lastMessage ? formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true }) : ''}
                        selected={selectedThreadId === thread.id}
                      />
                    </div>
                  );
                })}
              </ChatList>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col items-start self-stretch bg-gray-50">
          {selectedThread ? (
            <>
              <ChatHeader
                name={getThreadInfo(selectedThread).name}
                subtitle="Online"
                buttons={
                  <>
                    <IconButton variant="brand-tertiary" icon={<Paperclip className="w-4 h-4" />} />
                    <IconButton variant="brand-tertiary" icon={<Phone className="w-4 h-4" />} />
                  </>
                }
              />
              <div className="w-full flex-1 overflow-auto">
                <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center gap-4 px-4 py-8">
                  {isLoadingMessages ? (
                    <p>Loading messages...</p>
                  ) : (
                    messages?.map(msg =>
                      msg.sender_id === user?.id ? (
                        <ChatSent
                          key={msg.id}
                          name="You"
                          message={msg.message_text}
                          timestamp={formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        />
                      ) : (
                        <ChatReceived
                          key={msg.id}
                          avatar={msg.senderProfile?.profile_pic || ''}
                          initials={msg.senderProfile?.full_name?.charAt(0) || 'U'}
                          name={msg.senderProfile?.full_name || 'User'}
                          message={msg.message_text}
                          time={formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        />
                      )
                    )
                  )}
                </div>
              </div>
              <form onSubmit={handleSendMessage} className="flex w-full items-center gap-4 border-t border-gray-200 bg-white px-6 py-3">
                <IconButton variant="brand-tertiary" icon={<Paperclip className="w-5 h-5" />} />
                <TextFieldUnstyled className="flex-1">
                  <TextFieldUnstyled.Input
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </TextFieldUnstyled>
                <IconButton type="submit" variant="brand-primary" icon={<Send className="w-5 h-5 />} disabled={sendMessageMutation.isPending} />
              </form>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-500">
              {isLoadingThreads ? 'Loading conversations...' : 'Select a conversation to start chatting.'}
            </div>
          )}
        </div>
      </div>
    </DefaultPageLayout>
  );
};

export default Messages;
