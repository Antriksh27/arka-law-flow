import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, MessageCircle, Sparkles, Search, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCometChat } from '@/hooks/useCometChat';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ChatList from '@/components/messages/ui/ChatList';
import { cn } from '@/lib/utils';
import { MessageLoading } from '@/components/ui/message-loading';
import { createCometChatUser } from '@/lib/cometchat';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileStickyHeader } from '@/components/mobile/MobileStickyHeader';
import { MobileFAB } from '@/components/mobile/MobileFAB';
import TimeUtils from '@/lib/timeUtils';
import TimelineDivider from '@/components/messages/ui/TimelineDivider';
import { format } from 'date-fns';
interface TeamMember {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
}
interface ModernMessengerProps {
  onChannelSelect?: (channel: any) => void;
}
const ModernMessenger: React.FC<ModernMessengerProps> = ({
  onChannelSelect
}) => {
  const {
    user
  } = useAuth();
  const {
    isCometChatReady,
    cometChatUser
  } = useCometChat();
  const [selectedUser, setSelectedUser] = useState<CometChat.User | null>(null);
  const [messages, setMessages] = useState<CometChat.BaseMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [conversations, setConversations] = useState<CometChat.Conversation[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeTab, setActiveTab] = useState<'chats' | 'team'>('chats');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [messageStatuses, setMessageStatuses] = useState<Record<string, 'sent' | 'delivered' | 'read'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const MESSAGE_LISTENER_ID = 'modern_messenger_listener';
  const isMobile = useIsMobile();
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch team members and create CometChat users for them
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!user || !isCometChatReady) return;
      try {
        const {
          data,
          error
        } = await supabase.rpc('get_firm_members_for_chat');
        if (error) {
          console.error('Error fetching team members:', error);
          return;
        }
        if (data) {
          setTeamMembers(data);

          // Ensure all team members exist as CometChat users
          for (const member of data) {
            try {
              await CometChat.getUser(member.user_id);
            } catch (err) {
              // User doesn't exist, create them
              try {
                await createCometChatUser(member.user_id, member.full_name || member.email);
              } catch (createErr) {
                console.error(`Error creating CometChat user for ${member.user_id}:`, createErr);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in fetchTeamMembers:', error);
      }
    };
    fetchTeamMembers();
  }, [user, isCometChatReady]);

  // Fetch user's conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!isCometChatReady || !cometChatUser) return;
      try {
        const conversationsRequest = new CometChat.ConversationsRequestBuilder().setLimit(50).setConversationType(CometChat.RECEIVER_TYPE.USER) // Only fetch 1-on-1 user conversations
        .build();
        const conversationsList: CometChat.Conversation[] = await conversationsRequest.fetchNext();

        // Filter to only show conversations where current user is involved
        const currentUserId = cometChatUser.getUid();
        const filteredConversations = conversationsList.filter((conv: CometChat.Conversation) => {
          const lastMessage = conv.getLastMessage();
          if (!lastMessage) return false;
          const senderId = lastMessage.getSender()?.getUid();
          const receiverId = lastMessage.getReceiverId();

          // Only include if current user is sender or receiver
          return senderId === currentUserId || receiverId === currentUserId;
        });
        setConversations(filteredConversations);
        console.log('Filtered conversations for user:', currentUserId, filteredConversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };
    fetchConversations();
  }, [isCometChatReady, cometChatUser]);

  // Clear selected user when CometChat is not ready
  useEffect(() => {
    if (!isCometChatReady) {
      setSelectedUser(null);
      setMessages([]);
    }
  }, [isCometChatReady]);

  // Fetch messages when a user is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser || !cometChatUser) return;
      try {
        const messagesRequest = new CometChat.MessagesRequestBuilder().setUID(selectedUser.getUid()).setLimit(50).build();
        const messagesList = await messagesRequest.fetchPrevious();
        setMessages(messagesList);
        scrollToBottom();

        // Set initial statuses for messages
        const initialStatuses: Record<string, 'sent' | 'delivered' | 'read'> = {};
        messagesList.forEach((msg: CometChat.BaseMessage) => {
          const deliveredAt = (msg as any).getDeliveredAt?.();
          const readAt = (msg as any).getReadAt?.();
          if (readAt) {
            initialStatuses[msg.getId().toString()] = 'read';
          } else if (deliveredAt) {
            initialStatuses[msg.getId().toString()] = 'delivered';
          } else {
            initialStatuses[msg.getId().toString()] = 'sent';
          }
        });
        setMessageStatuses(initialStatuses);

        // Mark messages as read
        CometChat.markAsRead(messagesList[messagesList.length - 1]);

        // Set up real-time message listeners
        CometChat.addMessageListener(MESSAGE_LISTENER_ID, new CometChat.MessageListener({
          onTextMessageReceived: (message: CometChat.TextMessage) => {
            // Only add messages for the selected conversation
            if (message.getSender().getUid() === selectedUser.getUid() || message.getReceiverId() === selectedUser.getUid()) {
              setMessages(prevMessages => [...prevMessages, message]);
              setMessageStatuses(prev => ({
                ...prev,
                [message.getId().toString()]: 'sent'
              }));
              scrollToBottom();
              // Mark as read immediately since we're viewing
              CometChat.markAsRead(message);
            }
          },
          onMessagesDelivered: (messageReceipt: CometChat.MessageReceipt) => {
            const messageId = messageReceipt.getMessageId();
            setMessageStatuses(prev => {
              if (prev[messageId] !== 'read') {
                return {
                  ...prev,
                  [messageId]: 'delivered'
                };
              }
              return prev;
            });
          },
          onMessagesRead: (messageReceipt: CometChat.MessageReceipt) => {
            const messageId = messageReceipt.getMessageId();
            setMessageStatuses(prev => ({
              ...prev,
              [messageId]: 'read'
            }));
          },
          onTypingStarted: (typingIndicator: CometChat.TypingIndicator) => {
            if (typingIndicator.getSender().getUid() === selectedUser.getUid()) {
              setTypingUsers(prev => {
                const senderId = typingIndicator.getSender().getUid();
                if (!prev.includes(senderId)) {
                  return [...prev, senderId];
                }
                return prev;
              });
            }
          },
          onTypingEnded: (typingIndicator: CometChat.TypingIndicator) => {
            if (typingIndicator.getSender().getUid() === selectedUser.getUid()) {
              setTypingUsers(prev => prev.filter(id => id !== typingIndicator.getSender().getUid()));
            }
          }
        }));
        return () => {
          CometChat.removeMessageListener(MESSAGE_LISTENER_ID);
        };
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    fetchMessages();
    return () => {
      CometChat.removeMessageListener(MESSAGE_LISTENER_ID);
    };
  }, [selectedUser, cometChatUser]);
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedUser || !cometChatUser) return;
    try {
      const textMessage = new CometChat.TextMessage(selectedUser.getUid(), inputValue, CometChat.RECEIVER_TYPE.USER);
      const sentMessage = await CometChat.sendMessage(textMessage);
      setMessages(prevMessages => [...prevMessages, sentMessage]);
      setInputValue('');
      scrollToBottom();

      // End typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      const typingNotification = new CometChat.TypingIndicator(selectedUser.getUid(), CometChat.RECEIVER_TYPE.USER);
      CometChat.endTyping(typingNotification);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error sending message',
        description: 'Please try again',
        variant: 'destructive'
      });
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    // Send typing indicator
    if (selectedUser) {
      const typingNotification = new CometChat.TypingIndicator(selectedUser.getUid(), CometChat.RECEIVER_TYPE.USER);
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
  const getConversationName = (conversation: CometChat.Conversation): string => {
    const conversationWith = conversation.getConversationWith() as CometChat.User;
    return conversationWith.getName() || conversationWith.getUid();
  };
  const getConversationAvatar = (conversation: CometChat.Conversation): string => {
    const conversationWith = conversation.getConversationWith() as CometChat.User;
    return conversationWith.getAvatar() || '';
  };
  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  const handleStartDM = async (teamMember: TeamMember) => {
    if (!cometChatUser) return;
    try {
      // Get the user to chat with
      const userToChat = await CometChat.getUser(teamMember.user_id);
      setSelectedUser(userToChat);
      onChannelSelect?.(userToChat as any);

      // Switch to chats tab
      setActiveTab('chats');
    } catch (error) {
      console.error('Error starting DM:', error);
      toast({
        title: 'Error',
        description: 'Could not start chat with this user',
        variant: 'destructive'
      });
    }
  };
  if (!isCometChatReady || !cometChatUser) {
    return <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>;
  }

  // Mobile view
  if (isMobile) {
    if (showMobileChat && selectedUser) {
      return <div className="fixed inset-0 flex flex-col bg-background overflow-hidden z-50">
          {/* Header - Fixed top */}
          <div className="flex-shrink-0 bg-white border-b border-slate-200 safe-area-top">
            <div className="flex items-center gap-3 h-14 px-4">
              <button type="button" onClick={() => {
              setShowMobileChat(false);
              setSelectedUser(null);
            }} className="flex-shrink-0 p-2 -ml-2 rounded-xl active:scale-95 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-slate-100" aria-label="Go back">
                <ArrowLeft className="w-5 h-5 text-slate-900" />
              </button>
              <h1 className="text-lg font-semibold text-slate-900 truncate">{selectedUser.getName()}</h1>
            </div>
          </div>

          {/* Messages - Scrollable middle */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-2" style={{
          minHeight: 0
        }}>
            {messages.map((message, index) => {
            const isMe = message.getSender().getUid() === cometChatUser?.getUid();
            const messageText = (message as CometChat.TextMessage).getText?.() || '';
            const messageId = message.getId().toString();
            const status = messageStatuses[messageId] || 'sent';
            const messageDate = new Date(message.getSentAt() * 1000);
            const isToday = TimeUtils.isToday(messageDate);
            const timestamp = isToday 
              ? TimeUtils.formatTime(messageDate)
              : TimeUtils.formatDateTime(messageDate, 'dd/MM h:mm a');
            
            // Check if we need a date divider
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const prevMessageDate = prevMessage ? new Date(prevMessage.getSentAt() * 1000) : null;
            const showDateDivider = index === 0 || 
              (prevMessageDate && format(prevMessageDate, 'yyyy-MM-dd') !== format(messageDate, 'yyyy-MM-dd'));
            
            // Get date divider text
            const getDateDividerText = () => {
              if (TimeUtils.isToday(messageDate)) return 'Today';
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              if (format(messageDate, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) return 'Yesterday';
              return format(messageDate, 'MMMM d, yyyy');
            };
            
            return <React.Fragment key={message.getId()}>
                  {showDateDivider && <TimelineDivider>{getDateDividerText()}</TimelineDivider>}
                  <div className={cn('flex w-full', isMe ? 'justify-end' : 'justify-start')}>
                    <div className={cn('flex flex-col max-w-[75%]', isMe ? 'items-end' : 'items-start')}>
                      <div className={cn('flex items-end gap-2', isMe ? 'flex-row-reverse' : 'flex-row')}>
                        {!isMe && <Avatar className="h-6 w-6 flex-shrink-0 border border-white/20">
                            <AvatarImage src={message.getSender().getAvatar()} />
                            <AvatarFallback className="text-xs bg-slate-700 text-white">
                              {getInitials(message.getSender().getName())}
                            </AvatarFallback>
                          </Avatar>}
                        <div className={cn('px-3 py-2 rounded-2xl text-sm', isMe ? 'bg-blue-50 text-gray-900' : 'bg-gray-100 text-gray-900')}>
                          <p className="break-words whitespace-pre-wrap">{messageText}</p>
                        </div>
                      </div>
                      {/* Timestamp and read receipt */}
                      <div className={cn('flex items-center gap-1 mt-0.5 px-1', isMe ? 'flex-row-reverse' : 'flex-row')}>
                        <span className="text-[10px] text-gray-400">{timestamp}</span>
                        {isMe && <span className="flex items-center">
                            {status === 'read' ? <CheckCheck className="h-3 w-3 text-blue-500" /> : status === 'delivered' ? <CheckCheck className="h-3 w-3 text-gray-400" /> : <Check className="h-3 w-3 text-gray-400" />}
                          </span>}
                      </div>
                    </div>
                  </div>
                </React.Fragment>;
          })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input - Fixed bottom */}
          <div className="flex-shrink-0 border-t border-slate-200 bg-white p-3 pb-safe">
            <div className="flex items-center gap-2">
              <Input placeholder="Type a message..." value={inputValue} onChange={handleInputChange} onKeyPress={e => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }} className="flex-1 bg-slate-50 text-slate-900 placeholder:text-slate-400 border-slate-200 rounded-full px-4" />
              <Button onClick={handleSendMessage} size="icon" className="bg-slate-900 text-white hover:bg-slate-800 rounded-full h-10 w-10 flex-shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>;
    }

    // Chat list view
    return <div className="min-h-screen bg-background pb-24">
        <MobileStickyHeader 
          title="Messages"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search conversations..."
          tabs={[
            { value: 'chats', label: 'Chats', icon: <MessageCircle className="h-4 w-4" /> },
            { value: 'team', label: 'Team', icon: <Users className="h-4 w-4" /> }
          ]}
          activeTab={activeTab}
          onTabChange={(value) => setActiveTab(value as 'chats' | 'team')}
        />

        <div className="p-4 space-y-2">
            {activeTab === 'chats' && (conversations.length === 0 ? <div className="bg-slate-900 rounded-xl p-8 text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 text-white opacity-40" />
                  <p className="text-sm text-white/70">No conversations yet</p>
                </div> : conversations.map(conversation => {
            const lastMessage = conversation.getLastMessage();
            const lastMessageText = lastMessage ? (lastMessage as CometChat.TextMessage).getText?.() || 'Media' : 'No messages';
            const conversationWith = conversation.getConversationWith() as CometChat.User;
            return <div key={conversation.getConversationId()} onClick={() => {
              setSelectedUser(conversationWith);
              setShowMobileChat(true);
            }} className="rounded-xl p-4 active:scale-[0.98] transition-all cursor-pointer bg-sidebar text-sidebar-foreground">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-white/20">
                          <AvatarImage src={conversationWith.getAvatar()} />
                          <AvatarFallback className="bg-slate-700 text-white">
                            {getInitials(conversationWith.getName())}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate text-sidebar-foreground">{conversationWith.getName()}</h3>
                          <p className="text-xs truncate text-sidebar-foreground">{lastMessageText}</p>
                        </div>
                      </div>
                    </div>;
          }))}

            {activeTab === 'team' && (teamMembers.length === 0 ? <div className="bg-slate-900 rounded-xl p-8 text-center">
                  <Users className="h-12 w-12 mx-auto mb-3 text-white opacity-40" />
                  <p className="text-sm text-white/70">No team members</p>
                </div> : teamMembers.map(member => <div key={member.user_id} onClick={() => handleStartDM(member)} className="rounded-xl p-4 active:scale-[0.98] transition-all cursor-pointer bg-sidebar">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-white/20">
                        <AvatarFallback className="bg-slate-700 text-white">
                          {getInitials(member.full_name || member.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate text-sidebar-foreground">{member.full_name || member.email}</h3>
                        <p className="text-xs text-sidebar-foreground">{member.role}</p>
                      </div>
                    </div>
                  </div>))}
        </div>
      </div>;
  }

  // Desktop view
  return <div className="flex h-[calc(100vh-64px)] bg-gradient-to-br from-background via-background to-muted/20">
      {/* Sidebar */}
      <div className="w-80 border-r border-border/50 flex flex-col bg-card/95 backdrop-blur-sm">
        {/* Header */}
        <div className="p-6 border-b border-border/50">
          <h1 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Messages
          </h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Search conversations..." className="w-full pl-10 pr-4 py-2.5 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all bg-background" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/50 bg-muted/30">
          <button onClick={() => setActiveTab('chats')} className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all ${activeTab === 'chats' ? 'text-primary border-b-2 border-primary bg-background/50' : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'}`}>
            <MessageCircle className="h-4 w-4" />
            <span>Chats</span>
          </button>
          <button onClick={() => setActiveTab('team')} className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all ${activeTab === 'team' ? 'text-primary border-b-2 border-primary bg-background/50' : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'}`}>
            <Users className="h-4 w-4" />
            <span>Team</span>
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
              {teamMembers.length}
            </span>
          </button>
        </div>

        {/* Chat List or Team List */}
        <div className="flex-1 overflow-y-auto p-3">
          {activeTab === 'chats' && <ChatList>
              {conversations.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-foreground font-medium">No conversations yet</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Start a conversation with a team member
                  </p>
                </div> : conversations.map(conversation => {
            const lastMessage = conversation.getLastMessage();
            const lastMessageText = lastMessage ? (lastMessage as CometChat.TextMessage).getText?.() || 'Media message' : 'No messages yet';
            // Pass ISO string for proper date/time formatting in ChatList
            const lastMessageTime = lastMessage ? new Date(lastMessage.getSentAt() * 1000).toISOString() : '';
            return <ChatList.ChatListItem key={conversation.getConversationId()} avatar={getConversationAvatar(conversation)} name={getConversationName(conversation)} message={lastMessageText} timestamp={lastMessageTime} selected={selectedUser?.getUid() === (conversation.getConversationWith() as CometChat.User).getUid()} onClick={() => {
              const conversationWith = conversation.getConversationWith() as CometChat.User;
              setSelectedUser(conversationWith);
              onChannelSelect?.(conversationWith as any);
            }} />;
          })}
            </ChatList>}

          {activeTab === 'team' && <div className="space-y-1">
              {teamMembers.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-foreground font-medium">No team members</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Team members will appear here
                  </p>
                </div> : teamMembers.map(member => <button key={member.user_id} onClick={() => handleStartDM(member)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(member.full_name || member.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-sm text-foreground">
                        {member.full_name || member.email}
                      </p>
                      
                    </div>
                  </button>)}
            </div>}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-card">
        {selectedUser ? <>
            {/* Chat Header */}
            <div className="border-b border-border px-6 py-4 flex items-center gap-3 bg-card">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser.getAvatar()} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(selectedUser.getName())}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-foreground">
                  {selectedUser.getName()}
                </h3>
                {typingUsers.length > 0 && <p className="text-xs text-primary flex items-center gap-1">
                    <span>typing</span>
                    <MessageLoading />
                  </p>}
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {messages.map((message, index) => {
            const isMe = message.getSender().getUid() === cometChatUser?.getUid();
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
            const messageId = message.getId().toString();
            const status = messageStatuses[messageId] || 'sent';
            const messageDate = new Date(message.getSentAt() * 1000);
            const isToday = TimeUtils.isToday(messageDate);
            const timestamp = isToday 
              ? TimeUtils.formatTime(messageDate)
              : TimeUtils.formatDateTime(messageDate, 'dd/MM h:mm a');

            // Check if we need a date divider
            const prevMessageDate = prevMessage ? new Date(prevMessage.getSentAt() * 1000) : null;
            const showDateDivider = index === 0 || 
              (prevMessageDate && format(prevMessageDate, 'yyyy-MM-dd') !== format(messageDate, 'yyyy-MM-dd'));
            
            // Get date divider text
            const getDateDividerText = () => {
              if (TimeUtils.isToday(messageDate)) return 'Today';
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              if (format(messageDate, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) return 'Yesterday';
              return format(messageDate, 'MMMM d, yyyy');
            };

            // Check if this message is from the same sender as the previous one (considering date divider)
            const isSameSenderAsPrev = !showDateDivider && prevMessage && prevMessage.getSender().getUid() === message.getSender().getUid();
            const isSameSenderAsNext = nextMessage && nextMessage.getSender().getUid() === message.getSender().getUid() &&
              format(new Date(nextMessage.getSentAt() * 1000), 'yyyy-MM-dd') === format(messageDate, 'yyyy-MM-dd');

            // Show avatar only for the last message in a group
            const shouldShowAvatar = !isSameSenderAsNext;

            // Adjust spacing based on grouping
            const spacingClass = isSameSenderAsPrev ? 'mt-1.5' : 'mt-8';

            // Dynamic border radius based on position in group
            const borderRadius = !isSameSenderAsPrev && !isSameSenderAsNext ? 'rounded-2xl' // Single message (fully rounded)
            : !isSameSenderAsPrev && isSameSenderAsNext ? isMe ? 'rounded-tl-2xl rounded-tr-2xl rounded-bl-lg rounded-br-2xl' // First in group (right)
            : 'rounded-bl-2xl rounded-br-2xl rounded-tl-lg rounded-tr-2xl' // First in group (left)
            : isSameSenderAsPrev && isSameSenderAsNext ? isMe ? 'rounded-tl-lg rounded-tr-2xl rounded-bl-lg rounded-br-2xl' // Middle of group (right)
            : 'rounded-tl-2xl rounded-tr-lg rounded-bl-2xl rounded-br-lg' // Middle of group (left)
            : isMe ? 'rounded-tl-2xl rounded-tr-lg rounded-bl-2xl rounded-br-lg' // Last in group (right)
            : 'rounded-br-lg rounded-tl-lg rounded-tr-lg'; // Last in group (left)

            const messageText = (message as CometChat.TextMessage).getText?.() || '';
            return <React.Fragment key={message.getId()}>
                    {showDateDivider && <TimelineDivider>{getDateDividerText()}</TimelineDivider>}
                    <div className={spacingClass}>
                      <div className={cn('flex flex-col max-w-[70%]', isMe ? 'ml-auto items-end' : 'mr-auto items-start')}>
                        <div className={cn('flex items-end gap-3', isMe ? 'flex-row-reverse' : '')}>
                          {/* Avatar with animation */}
                          <AnimatePresence mode="wait">
                            {shouldShowAvatar ? <motion.div key="avatar" initial={{
                        opacity: 0,
                        scale: 0.8
                      }} animate={{
                        opacity: 1,
                        scale: 1
                      }} exit={{
                        opacity: 0,
                        scale: 0.8
                      }} transition={{
                        duration: 0.2
                      }} className="flex-shrink-0">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={message.getSender().getAvatar()} />
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {getInitials(message.getSender().getName())}
                                  </AvatarFallback>
                                </Avatar>
                              </motion.div> : <div className="w-8 flex-shrink-0" />}
                          </AnimatePresence>

                          {/* Message bubble with animation */}
                          <motion.div initial={{
                      opacity: 0,
                      y: 10,
                      scale: 0.95
                    }} animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1
                    }} transition={{
                      duration: 0.3,
                      ease: 'easeOut'
                    }} className={cn('px-4 py-2.5 shadow-sm relative overflow-hidden', borderRadius, isMe ? 'bg-blue-100 text-black' : 'bg-green-100 text-black')}>
                            {/* Subtle shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

                            {/* Message content */}
                            <div className="relative">
                              <p className="text-sm leading-relaxed break-words">{messageText}</p>
                            </div>
                          </motion.div>
                        </div>
                        
                        {/* Timestamp and read receipt */}
                        {shouldShowAvatar && <div className={cn('flex items-center gap-1 mt-1 px-11', isMe ? 'flex-row-reverse' : '')}>
                            <span className="text-xs text-muted-foreground">{timestamp}</span>
                            {isMe && <span className="flex items-center">
                                {status === 'read' ? <CheckCheck className="h-3.5 w-3.5 text-blue-500" /> : status === 'delivered' ? <CheckCheck className="h-3.5 w-3.5 text-gray-400" /> : <Check className="h-3.5 w-3.5 text-gray-400" />}
                              </span>}
                          </div>}
                      </div>
                    </div>
                  </React.Fragment>;
          })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-border px-6 py-4 bg-card">
              <div className="flex items-center gap-3">
                <Input placeholder="Type a message..." value={inputValue} onChange={handleInputChange} onKeyPress={e => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }} className="flex-1" />
                <Button onClick={handleSendMessage} size="icon" className="h-10 w-10">
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </> : <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <Sparkles className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Start a Conversation
            </h3>
            <p className="text-muted-foreground max-w-md">
              Select a chat from your conversations or choose a team member to start messaging
            </p>
          </div>}
      </div>
    </div>;
};
export default ModernMessenger;