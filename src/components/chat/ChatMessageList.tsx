import React, { useEffect, useState, useRef } from 'react';
import { CometChat } from '@/lib/cometchat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

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

  const renderMessage = (message: CometChat.BaseMessage) => {
    const isOwnMessage = message.getSender().getUid() === currentUserId;
    const textMessage = message as CometChat.TextMessage;
    const timestamp = format(new Date(message.getSentAt() * 1000), 'HH:mm');

    return (
      <div
        key={message.getId()}
        className={`flex gap-2 mb-4 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {!isOwnMessage && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {message.getSender().getName().charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}

        <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          {!isOwnMessage && (
            <span className="text-xs text-muted-foreground mb-1 px-2">
              {message.getSender().getName()}
            </span>
          )}
          
          <div
            className={`rounded-2xl px-4 py-2 ${
              isOwnMessage
                ? 'bg-primary text-primary-foreground'
                : 'bg-accent text-accent-foreground'
            }`}
          >
            <p className="text-sm break-words">{textMessage.getText()}</p>
          </div>

          <div className="flex items-center gap-1 mt-1 px-2">
            <span className="text-xs text-muted-foreground">{timestamp}</span>
            {isOwnMessage && (
              <span>
                {textMessage.getReadAt() ? (
                  <CheckCheck className="h-3 w-3 text-blue-500" />
                ) : textMessage.getDeliveredAt() ? (
                  <CheckCheck className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <Check className="h-3 w-3 text-muted-foreground" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading messages...</div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        <div>
          {messages.map(renderMessage)}
          {isTyping && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex gap-1">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce [animation-delay:0.2s]">●</span>
                <span className="animate-bounce [animation-delay:0.4s]">●</span>
              </div>
              <span>{selectedUser.getName()} is typing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
    </ScrollArea>
  );
};
