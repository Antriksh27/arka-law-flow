import React, { useEffect, useState, useRef } from 'react';
import { CometChat } from '@/lib/cometchat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Check, CheckCheck, Loader2, MessageCircle } from 'lucide-react';

interface ChatMessageListProps {
  selectedUser: CometChat.User;
  currentUserId: string;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({ selectedUser, currentUserId }) => {
  const [messages, setMessages] = useState<CometChat.BaseMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    setupListeners();

    return () => {
      cleanupListeners();
    };
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    setLoading(true);
    const limit = 50;
    const messagesRequest = new CometChat.MessagesRequestBuilder()
      .setUID(selectedUser.getUid())
      .setLimit(limit)
      .build();

    try {
      const fetchedMessages = await messagesRequest.fetchPrevious();
      setMessages(fetchedMessages);
      
      // Mark messages as read
      CometChat.markAsRead(selectedUser.getUid(), 'user');
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupListeners = () => {
    const listenerID = `message_listener_${selectedUser.getUid()}`;

    CometChat.addMessageListener(
      listenerID,
      new CometChat.MessageListener({
        onTextMessageReceived: (message: CometChat.TextMessage) => {
          if (message.getSender().getUid() === selectedUser.getUid()) {
            setMessages(prev => [...prev, message]);
            CometChat.markAsRead(message.getId().toString(), 'message', message.getSender().getUid());
          }
        },
        onMessagesDelivered: (receipt: CometChat.MessageReceipt) => {
          updateMessageReceipts(receipt);
        },
        onMessagesRead: (receipt: CometChat.MessageReceipt) => {
          updateMessageReceipts(receipt);
        }
      })
    );

    // Typing indicator listener
    CometChat.addCallListener(
      listenerID,
      new CometChat.CallListener({
        onIncomingCallReceived: () => {},
        onOutgoingCallAccepted: () => {},
        onOutgoingCallRejected: () => {},
        onIncomingCallCancelled: () => {}
      })
    );

    const typingListenerID = `typing_${selectedUser.getUid()}`;
    CometChat.addMessageListener(
      typingListenerID,
      new CometChat.MessageListener({
        onTypingStarted: (typingIndicator: CometChat.TypingIndicator) => {
          if (typingIndicator.getSender().getUid() === selectedUser.getUid()) {
            setIsTyping(true);
          }
        },
        onTypingEnded: (typingIndicator: CometChat.TypingIndicator) => {
          if (typingIndicator.getSender().getUid() === selectedUser.getUid()) {
            setIsTyping(false);
          }
        }
      })
    );
  };

  const cleanupListeners = () => {
    CometChat.removeMessageListener(`message_listener_${selectedUser.getUid()}`);
    CometChat.removeMessageListener(`typing_${selectedUser.getUid()}`);
  };

  const updateMessageReceipts = (receipt: CometChat.MessageReceipt) => {
    setMessages(prev => 
      prev.map(msg => {
        if (msg.getId().toString() === receipt.getMessageId()) {
          const textMsg = msg as CometChat.TextMessage;
          if (receipt.getReceiptType() === 'delivered') {
            textMsg.setDeliveredAt(receipt.getDeliveredAt());
          } else if (receipt.getReceiptType() === 'read') {
            textMsg.setReadAt(receipt.getReadAt());
          }
        }
        return msg;
      })
    );
  };

  const renderMessage = (message: CometChat.BaseMessage, index: number) => {
    const isOwn = message.getSender().getUid() === currentUserId;
    const textMessage = message as CometChat.TextMessage;
    const timestamp = new Date(message.getSentAt() * 1000);
    
    // Check if we need to show date separator
    const showDateSeparator = index === 0 || 
      new Date(messages[index - 1]?.getSentAt() * 1000).toDateString() !== timestamp.toDateString();

    return (
      <React.Fragment key={message.getId()}>
        {showDateSeparator && (
          <div className="flex items-center justify-center my-4">
            <div className="bg-muted px-3 py-1 rounded-full">
              <span className="text-xs font-medium text-muted-foreground">
                {timestamp.toLocaleDateString([], { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        )}

        <div
          className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 px-1 animate-in fade-in slide-in-from-bottom-2 duration-300`}
        >
          <div className={`flex gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            {!isOwn && (
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">
                  {message.getSender().getName().charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}

            <div className="flex flex-col gap-1">
              {!isOwn && (
                <span className="text-xs font-medium text-muted-foreground ml-3">
                  {message.getSender().getName()}
                </span>
              )}

              <div
                className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                  isOwn
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-card border rounded-tl-sm'
                }`}
              >
                <p className="text-sm leading-relaxed break-words">{textMessage.getText()}</p>
              </div>

              <div className={`flex items-center gap-1.5 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <span className="text-xs text-muted-foreground">
                  {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {isOwn && (
                  <span>
                    {message.getReadAt() > 0 ? (
                      <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                    ) : message.getDeliveredAt() > 0 ? (
                      <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Check className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center space-y-3 p-8">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
            <MessageCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">No messages yet</p>
            <p className="text-sm text-muted-foreground">
              Start the conversation by sending a message below
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full bg-background">
      <div className="p-4 pb-2">
        <div ref={messagesEndRef}>
          {messages.map((message, index) => renderMessage(message, index))}
          
          {isTyping && (
            <div className="flex items-center gap-2 mb-4 ml-12 animate-in fade-in duration-300">
              <div className="bg-card border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
};
