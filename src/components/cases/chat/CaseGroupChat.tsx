import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCaseGroupChat } from '@/hooks/useCaseGroupChat';
import { useCometChat } from '@/hooks/useCometChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Users, Settings, Send, MessageSquare } from 'lucide-react';
import { ManageParticipantsDialog } from './ManageParticipantsDialog';
import { MessageLoading } from '@/components/ui/message-loading';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CaseGroupChatProps {
  caseId: string;
  caseName: string;
  firmId: string;
}

export const CaseGroupChat: React.FC<CaseGroupChatProps> = ({ caseId, caseName, firmId }) => {
  const { group, members, isLoading, error, isReady, isAdmin } = useCaseGroupChat({
    caseId,
    caseName,
    firmId
  });
  const { cometChatUser } = useCometChat();
  const [showParticipantsDialog, setShowParticipantsDialog] = useState(false);
  const [messages, setMessages] = useState<CometChat.BaseMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const MESSAGE_LISTENER_ID = `case_chat_${caseId}`;

  // Fetch messages when group is ready
  useEffect(() => {
    const fetchMessages = async () => {
      if (!group || !cometChatUser) return;

      try {
        const messagesRequest = new CometChat.MessagesRequestBuilder()
          .setGUID(`case_${caseId}`)
          .setLimit(100)
          .build();
        
        const messagesList = await messagesRequest.fetchPrevious();
        setMessages(messagesList);
        scrollToBottom();

        // Set up real-time message listeners
        CometChat.addMessageListener(
          MESSAGE_LISTENER_ID,
          new CometChat.MessageListener({
            onTextMessageReceived: (message: CometChat.TextMessage) => {
              if (message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP && 
                  message.getReceiverId() === `case_${caseId}`) {
                setMessages(prevMessages => [...prevMessages, message]);
                scrollToBottom();
              }
            },
            onTypingStarted: (typingIndicator: CometChat.TypingIndicator) => {
              if (typingIndicator.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP &&
                  typingIndicator.getReceiverId() === `case_${caseId}`) {
                const senderId = typingIndicator.getSender().getUid();
                setTypingUsers(prev => {
                  if (!prev.includes(senderId)) {
                    return [...prev, senderId];
                  }
                  return prev;
                });
              }
            },
            onTypingEnded: (typingIndicator: CometChat.TypingIndicator) => {
              if (typingIndicator.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP &&
                  typingIndicator.getReceiverId() === `case_${caseId}`) {
                setTypingUsers(prev => prev.filter(id => id !== typingIndicator.getSender().getUid()));
              }
            }
          })
        );
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
    return () => {
      CometChat.removeMessageListener(MESSAGE_LISTENER_ID);
    };
  }, [group, cometChatUser, caseId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !group || !cometChatUser) return;

    try {
      const textMessage = new CometChat.TextMessage(
        `case_${caseId}`,
        inputValue,
        CometChat.RECEIVER_TYPE.GROUP
      );
      
      const sentMessage = await CometChat.sendMessage(textMessage);
      setMessages(prevMessages => [...prevMessages, sentMessage]);
      setInputValue('');
      scrollToBottom();

      // End typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      const typingNotification = new CometChat.TypingIndicator(
        `case_${caseId}`,
        CometChat.RECEIVER_TYPE.GROUP
      );
      CometChat.endTyping(typingNotification);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    // Send typing indicator
    if (group) {
      const typingNotification = new CometChat.TypingIndicator(
        `case_${caseId}`,
        CometChat.RECEIVER_TYPE.GROUP
      );
      CometChat.startTyping(typingNotification);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // End typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        CometChat.endTyping(typingNotification);
      }, 3000);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTypingUserNames = (): string => {
    const typingMembers = members.filter(m => typingUsers.includes(m.getUid()));
    if (typingMembers.length === 0) return '';
    if (typingMembers.length === 1) return typingMembers[0].getName();
    if (typingMembers.length === 2) {
      return `${typingMembers[0].getName()} and ${typingMembers[1].getName()}`;
    }
    return `${typingMembers[0].getName()} and ${typingMembers.length - 1} others`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="p-4 bg-white border-b border-slate-100">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          <Skeleton className="h-16 w-3/4 rounded-2xl" />
          <Skeleton className="h-16 w-3/4 ml-auto rounded-2xl" />
          <Skeleton className="h-16 w-3/4 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 text-center p-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Not a member</h3>
        <p className="text-slate-500 text-sm">Ask an admin to add you to this chat</p>
      </div>
    );
  }

  if (!isReady || !group) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-primary animate-spin" />
          <p className="text-slate-500 text-sm">Initializing chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* iOS-style Chat Header */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">{group.getName()}</h3>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500">
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </p>
                {typingUsers.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-sky-500">{getTypingUserNames()} typing</span>
                    <MessageLoading />
                  </div>
                )}
              </div>
            </div>
          </div>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowParticipantsDialog(true)}
              className="h-9 w-9 rounded-full bg-slate-50 hover:bg-slate-100"
            >
              <Settings className="w-4 h-4 text-slate-600" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-1"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-900 font-medium">No messages yet</p>
            <p className="text-slate-500 text-sm mt-1">
              Start the conversation with your team
            </p>
          </div>
        )}

        {messages.map((message, index) => {
          const isMe = message.getSender().getUid() === cometChatUser?.getUid();
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

          const isSameSenderAsPrev = prevMessage && 
            prevMessage.getSender().getUid() === message.getSender().getUid();
          const isSameSenderAsNext = nextMessage && 
            nextMessage.getSender().getUid() === message.getSender().getUid();

          const shouldShowAvatar = !isSameSenderAsNext;
          const spacingClass = isSameSenderAsPrev ? 'mt-0.5' : 'mt-4';

          const messageText = (message as CometChat.TextMessage).getText?.() || '';
          const senderName = message.getSender().getName();
          const timestamp = new Date(message.getSentAt() * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div
              key={message.getId()}
              className={cn(
                'flex items-end gap-2',
                isMe ? 'flex-row-reverse' : 'flex-row',
                spacingClass
              )}
            >
              {/* Avatar */}
              {shouldShowAvatar && !isMe ? (
                <Avatar className="h-7 w-7 mb-5">
                  <AvatarImage src={message.getSender().getAvatar()} />
                  <AvatarFallback className="bg-emerald-50 text-emerald-600 text-xs font-medium">
                    {getInitials(senderName)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                !isMe && <div className="w-7" />
              )}

              {/* Message Bubble */}
              <div className={cn('flex flex-col max-w-[75%]', isMe ? 'items-end' : 'items-start')}>
                {!isMe && !isSameSenderAsPrev && (
                  <span className="text-xs text-slate-500 mb-1 ml-1 font-medium">
                    {senderName}
                  </span>
                )}
                
                <div
                  className={cn(
                    'px-3.5 py-2 shadow-sm',
                    isSameSenderAsPrev && isSameSenderAsNext
                      ? 'rounded-2xl'
                      : !isSameSenderAsPrev && isSameSenderAsNext
                      ? isMe ? 'rounded-2xl rounded-br-lg' : 'rounded-2xl rounded-bl-lg'
                      : isSameSenderAsPrev && !isSameSenderAsNext
                      ? isMe ? 'rounded-2xl rounded-tr-lg' : 'rounded-2xl rounded-tl-lg'
                      : 'rounded-2xl',
                    isMe
                      ? 'bg-sky-500 text-white'
                      : 'bg-white text-slate-900'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{messageText}</p>
                </div>

                {shouldShowAvatar && (
                  <span className="text-[10px] text-slate-400 mt-1 mx-1">
                    {timestamp}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Input Area - iOS style */}
      <div className="flex-shrink-0 bg-white border-t border-slate-100 p-3 pb-safe">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Message..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 h-10 bg-slate-50 border-0 rounded-full px-4 text-sm placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-sky-200"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            size="icon"
            className="h-10 w-10 rounded-full bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Manage Participants Dialog */}
      <ManageParticipantsDialog
        open={showParticipantsDialog}
        onClose={() => setShowParticipantsDialog(false)}
        caseId={caseId}
        groupGuid={`case_${caseId}`}
      />
    </div>
  );
};
