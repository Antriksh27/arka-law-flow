
import React, { useState, useEffect, useRef } from 'react';
import { Paperclip, Phone, Send, Info } from 'lucide-react';
import ChatHeader from '@/components/messages/ui/ChatHeader';
import { IconButton } from '@/components/messages/ui/IconButton';
import { TextFieldUnstyled } from '@/components/messages/ui/TextFieldUnstyled';
import TimelineDivider from '@/components/messages/ui/TimelineDivider';
import ChatReceived from '@/components/messages/ui/ChatReceived';
import ChatSent from '@/components/messages/ui/ChatSent';
import { useMessages } from '@/hooks/use-messages';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface ChatViewProps {
  threadId: string | null;
  threadData: any | null;
}

export const ChatView: React.FC<ChatViewProps> = ({ threadId, threadData }) => {
  const { data: messages = [], isLoading } = useMessages(threadId);
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !threadId || !user) return;
    const messageText = newMessage;
    setNewMessage('');
    
    const { error } = await supabase.from('messages').insert({
      thread_id: threadId,
      sender_id: user.id,
      message_text: messageText,
    });
    if (error) {
      console.error('Error sending message:', error);
      // Re-set message on error to allow user to retry
      setNewMessage(messageText);
    }
  };

  if (!threadId) {
    return (
      <div className="flex grow flex-col items-center justify-center h-full bg-gray-50 text-gray-500">
        <Info className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-semibold">Select a conversation</h2>
        <p>Choose a chat from the sidebar to start messaging.</p>
      </div>
    );
  }

  const getSubtitle = () => {
    if (!threadData) return 'Loading...';
    if (threadData.is_private) {
        return threadData.otherParticipants.map((p: any) => p.role || 'Member').join(', ');
    }
    return `Case: ${threadData.title}`;
  }

  return (
    <div className="flex grow shrink-0 basis-0 flex-col items-start self-stretch h-full">
      <ChatHeader
        name={threadData?.title || 'Loading...'}
        subtitle={getSubtitle()}
        buttons={
          <div className="flex items-center gap-2">
            <IconButton variant="brand-tertiary" icon={<Phone className="w-5 h-5" />} />
          </div>
        }
      />
      <div className="flex w-full grow shrink-0 basis-0 flex-col justify-end overflow-hidden bg-gray-50">
        <div className="w-full grow shrink-0 basis-0 overflow-y-auto px-6 py-8 space-y-6">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-16 w-3/4" />
              <Skeleton className="h-16 w-3/4 self-end ml-auto" />
              <Skeleton className="h-16 w-3/4" />
            </div>
          )}
          {!isLoading && messages.length === 0 && (
            <div className="text-center text-gray-500">
              <p>This is the beginning of your conversation.</p>
            </div>
          )}
          {messages.map((msg, index) => {
            const showDivider = index === 0 || format(new Date(messages[index-1].created_at), 'yyyy-MM-dd') !== format(new Date(msg.created_at), 'yyyy-MM-dd');
            const messageComponent = msg.sender_id === user?.id ? (
              <ChatSent
                key={msg.id}
                name="You"
                message={msg.message_text}
                timestamp={format(new Date(msg.created_at), 'p')}
              />
            ) : (
              <ChatReceived
                key={msg.id}
                avatar={msg.sender?.profile_pic || ''}
                initials={msg.sender?.full_name?.charAt(0) || '?'}
                name={msg.sender?.full_name || 'Unknown User'}
                message={msg.message_text}
                time={format(new Date(msg.created_at), 'p')}
              />
            );
            
            return (
              <React.Fragment key={`fragment-${msg.id}`}>
                {showDivider && <TimelineDivider>{format(new Date(msg.created_at), 'MMMM d, yyyy')}</TimelineDivider>}
                {messageComponent}
              </React.Fragment>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="flex w-full items-center gap-4 border-t border-solid border-gray-200 bg-white px-4 py-3">
        <IconButton variant="brand-tertiary" icon={<Paperclip className="w-5 h-5" />} />
        <TextFieldUnstyled className="h-auto grow shrink-0 basis-0">
          <TextFieldUnstyled.Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
        </TextFieldUnstyled>
        <IconButton
          variant="brand-primary"
          icon={<Send className="w-5 h-5" />}
          onClick={handleSendMessage}
        />
      </div>
    </div>
  );
};

