import React, { useState, useEffect, useRef } from 'react';
import { Phone, Send, Info } from 'lucide-react';
import ChatHeader from '@/components/messages/ui/ChatHeader';
import { IconButton } from '@/components/messages/ui/IconButton';
import { TextFieldUnstyled } from '@/components/messages/ui/TextFieldUnstyled';
import TimelineDivider from '@/components/messages/ui/TimelineDivider';
import ChatReceived from '@/components/messages/ui/ChatReceived';
import ChatSent from '@/components/messages/ui/ChatSent';
import { useMessages } from '@/hooks/use-messages';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useSendMessage } from '@/hooks/use-send-message';
import { useMessageReactions } from '@/hooks/use-message-reactions';
import { useAddReaction } from '@/hooks/use-add-reaction';
import { useFileUpload } from '@/hooks/use-file-upload';
import { FileUploadArea } from '@/components/messages/FileUploadArea';
interface ChatViewProps {
  threadId: string | null;
  threadData: any | null;
}
export const ChatView: React.FC<ChatViewProps> = ({
  threadId,
  threadData
}) => {
  const {
    data: messages = [],
    isLoading
  } = useMessages(threadId);
  const {
    user
  } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    mutate: sendMessage,
    isPending: isSendingMessage
  } = useSendMessage(threadId);
  const messageIds = (messages || []).map(m => m.id);
  const {
    data: reactionsMap = {}
  } = useMessageReactions(messageIds);
  const {
    mutate: addReaction
  } = useAddReaction();
  const {
    uploadFiles,
    isUploading
  } = useFileUpload(threadId);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  };
  useEffect(scrollToBottom, [messages]);
  const handleSendMessage = async () => {
    const messageText = newMessage.trim();
    if (!messageText && selectedFiles.length === 0 || isSendingMessage || isUploading) return;
    try {
      let attachments;
      if (selectedFiles.length > 0) {
        attachments = await uploadFiles(selectedFiles);
      }
      setNewMessage('');
      setSelectedFiles([]);
      sendMessage({
        messageText,
        attachments
      }, {
        onError: () => {
          setNewMessage(messageText);
          setSelectedFiles(selectedFiles);
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
  };
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  const handleReactionAdd = (messageId: string, emoji: string) => {
    addReaction({
      messageId,
      emoji
    });
  };
  if (!threadId) {
    return <div className="flex grow flex-col items-center justify-center h-full bg-slate-50 text-slate-500">
        <Info className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-semibold">Select a conversation</h2>
        <p>Choose a chat from the sidebar to start messaging.</p>
      </div>;
  }
  const getSubtitle = () => {
    if (!threadData) return 'Loading...';
    if (threadData.is_private) {
      return threadData.otherParticipants.map((p: any) => p.role || 'Member').join(', ');
    }
    return `Case: ${threadData.title}`;
  };
  return <div className="flex grow shrink-0 basis-0 flex-col items-start self-stretch h-full">
      <ChatHeader name={threadData?.title || 'Loading...'} subtitle={getSubtitle()} buttons={<div className="flex items-center gap-2">
            
          </div>} />
      <div className="flex w-full grow shrink-0 basis-0 flex-col justify-end overflow-hidden bg-slate-50">
        <div className="w-full grow shrink-0 basis-0 overflow-y-auto px-6 py-8 space-y-6">
          {isLoading && <div className="space-y-4">
              <Skeleton className="h-16 w-3/4" />
              <Skeleton className="h-16 w-3/4 self-end ml-auto" />
              <Skeleton className="h-16 w-3/4" />
            </div>}
          {!isLoading && messages.length === 0 && <div className="text-center text-slate-500">
              <p>This is the beginning of your conversation.</p>
            </div>}
          {messages.map((msg, index) => {
          const showDivider = index === 0 || format(new Date(messages[index - 1].created_at), 'yyyy-MM-dd') !== format(new Date(msg.created_at), 'yyyy-MM-dd');
          const messageReactions = reactionsMap[msg.id] || [];
          const messageComponent = msg.sender_id === user?.id ? <ChatSent key={msg.id} name="You" message={msg.message_text} timestamp={format(new Date(msg.created_at), 'p')} attachments={msg.attachments} reactions={messageReactions} onReactionAdd={emoji => handleReactionAdd(msg.id, emoji)} onReactionClick={emoji => handleReactionAdd(msg.id, emoji)} /> : <ChatReceived key={msg.id} avatar={msg.sender?.profile_pic || ''} initials={msg.sender?.full_name?.charAt(0) || '?'} name={msg.sender?.full_name || 'Unknown User'} message={msg.message_text} time={format(new Date(msg.created_at), 'p')} attachments={msg.attachments} reactions={messageReactions} onReactionAdd={emoji => handleReactionAdd(msg.id, emoji)} onReactionClick={emoji => handleReactionAdd(msg.id, emoji)} />;
          return <React.Fragment key={`fragment-${msg.id}`}>
                {showDivider && <TimelineDivider>{format(new Date(msg.created_at), 'MMMM d, yyyy')}</TimelineDivider>}
                {messageComponent}
              </React.Fragment>;
        })}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="flex w-full flex-col border-t border-solid border-slate-200 bg-white">
        <FileUploadArea onFilesSelected={handleFilesSelected} selectedFiles={selectedFiles} onRemoveFile={handleRemoveFile} />
        <div className="flex items-center gap-4 px-4 py-3">
          <TextFieldUnstyled className="h-auto grow shrink-0 basis-0">
            <TextFieldUnstyled.Input placeholder="Type your message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }} disabled={isSendingMessage || isUploading} />
          </TextFieldUnstyled>
          <IconButton variant="brand-primary" icon={<Send className="w-5 h-5" />} onClick={handleSendMessage} disabled={isSendingMessage || isUploading || !newMessage.trim() && selectedFiles.length === 0} />
        </div>
      </div>
    </div>;
};
