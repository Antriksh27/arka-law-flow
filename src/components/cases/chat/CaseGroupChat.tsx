import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCaseGroupChat } from '@/hooks/useCaseGroupChat';
import { useCometChat } from '@/hooks/useCometChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Users, Settings, Send } from 'lucide-react';
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
      <div className="space-y-4 p-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-32 w-3/4" />
        <Skeleton className="h-32 w-3/4 ml-auto" />
        <Skeleton className="h-32 w-3/4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center p-6">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load chat</h3>
        <p className="text-muted-foreground">
          {error.message || 'Unable to create or load the case chat. Please try again.'}
        </p>
      </div>
    );
  }

  if (!isReady || !group) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Initializing chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-background via-background to-muted/20">
      {/* Chat Header */}
      <div className="border-b border-border px-6 py-4 bg-card/95 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{group.getName()}</h3>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {members.length} {members.length === 1 ? 'participant' : 'participants'}
                </p>
                {typingUsers.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <span>{getTypingUserNames()} typing</span>
                    <MessageLoading />
                  </div>
                )}
              </div>
            </div>
          </div>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowParticipantsDialog(true)}
              className="gap-2 hover:bg-accent transition-colors"
            >
              <Settings className="w-4 h-4" />
              Manage
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-card [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-muted/50 p-4 rounded-full mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium">No messages yet</p>
            <p className="text-muted-foreground text-sm mt-1">
              Start the conversation with your team
            </p>
          </div>
        )}

        {messages.map((message, index) => {
          const isMe = message.getSender().getUid() === cometChatUser?.getUid();
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

          // Check if this message is from the same sender as the previous one
          const isSameSenderAsPrev = prevMessage && 
            prevMessage.getSender().getUid() === message.getSender().getUid();
          const isSameSenderAsNext = nextMessage && 
            nextMessage.getSender().getUid() === message.getSender().getUid();

          // Show avatar only for the last message in a group
          const shouldShowAvatar = !isSameSenderAsNext;

          // Adjust spacing based on grouping
          const spacingClass = isSameSenderAsPrev ? 'mt-1.5' : 'mt-8';

          // Dynamic border radius based on position in group
          const borderRadius = !isSameSenderAsPrev && !isSameSenderAsNext
            ? 'rounded-2xl' // Single message (fully rounded)
            : !isSameSenderAsPrev && isSameSenderAsNext
            ? isMe
              ? 'rounded-tl-2xl rounded-tr-2xl rounded-bl-lg rounded-br-2xl' // First in group (right)
              : 'rounded-bl-2xl rounded-br-2xl rounded-tl-lg rounded-tr-2xl' // First in group (left)
            : isSameSenderAsPrev && isSameSenderAsNext
            ? isMe
              ? 'rounded-tl-lg rounded-tr-2xl rounded-bl-lg rounded-br-2xl' // Middle of group (right)
              : 'rounded-tl-2xl rounded-tr-lg rounded-bl-2xl rounded-br-lg' // Middle of group (left)
            : isMe
            ? 'rounded-tl-2xl rounded-tr-lg rounded-bl-2xl rounded-br-lg' // Last in group (right)
            : 'rounded-tl-2xl rounded-tr-lg rounded-bl-2xl rounded-br-lg'; // Last in group (left)

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
                <Avatar className="h-8 w-8 mb-1">
                  <AvatarImage src={message.getSender().getAvatar()} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(senderName)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                !isMe && <div className="w-8" />
              )}

              {/* Message Bubble */}
              <div className={cn('flex flex-col max-w-[70%]', isMe ? 'items-end' : 'items-start')}>
                {/* Sender name for first message in group (group chats only, not own messages) */}
                {!isMe && !isSameSenderAsPrev && (
                  <span className="text-xs text-muted-foreground mb-1 px-3">
                    {senderName}
                  </span>
                )}
                
                <div
                  className={cn(
                    'px-4 py-2.5 shadow-sm transition-all',
                    borderRadius,
                    isMe
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/80 text-foreground'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{messageText}</p>
                </div>

                {/* Timestamp for last message in group */}
                {shouldShowAvatar && (
                  <span className="text-xs text-muted-foreground mt-1 px-3">
                    {timestamp}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Input
            placeholder="Type your message..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 bg-background border-border/50 focus:ring-2 focus:ring-primary/50"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            size="icon"
            className="h-10 w-10 rounded-xl"
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
