import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChatInput } from '@/components/ui/chat-input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Search, Users, MessageCircle } from 'lucide-react';
import { useStreamChat } from '@/contexts/StreamChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MessageLoading } from '@/components/ui/message-loading';
import ChatList from './ui/ChatList';
import { Channel } from 'stream-chat';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
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
    client,
    isReady
  } = useStreamChat();
  const {
    user
  } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeTab, setActiveTab] = useState<'chats' | 'team'>('chats');
  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch team members using RPC function (same as StreamChat.tsx)
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!user) return;
      try {
        // Get current user's firm
        const {
          data: currentMember
        } = await supabase.from('team_members').select('firm_id').eq('user_id', user.id).maybeSingle();
        if (!currentMember?.firm_id) {
          console.warn('No firm membership found for current user');
          setTeamMembers([]);
          return;
        }

        // Fetch firm members via secure RPC (bypasses RLS safely)
        const {
          data: rpcData,
          error: rpcErr
        } = await supabase.rpc('get_firm_members_for_chat');
        if (rpcErr) {
          console.error('Error fetching firm members via RPC:', rpcErr);
          toast({
            title: 'Error loading team members',
            description: 'Could not fetch team members',
            variant: 'destructive'
          });
          setTeamMembers([]);
          return;
        }
        const formattedMembers: TeamMember[] = (rpcData || []).filter((m: any) => m.user_id !== user.id) // Exclude current user
        .map((m: any) => ({
          user_id: m.user_id,
          full_name: m.full_name || m.email || 'Unknown User',
          email: m.email || '',
          role: m.role || 'member'
        }));
        setTeamMembers(formattedMembers);
      } catch (error) {
        console.error('Error fetching team members:', error);
        toast({
          title: 'Error',
          description: 'Failed to load team members',
          variant: 'destructive'
        });
      }
    };
    fetchTeamMembers();
  }, [user]);

  // Fetch channels
  useEffect(() => {
    if (!client || !isReady) return;
    const fetchChannels = async () => {
      try {
        const filter = {
          type: 'messaging',
          members: {
            $in: [client.userID!]
          }
        };
        const sort = [{
          last_message_at: -1 as const
        }];
        const channelsResponse = await client.queryChannels(filter, sort, {
          limit: 20
        });
        setChannels(channelsResponse);
      } catch (error) {
        console.error('Error fetching channels:', error);
        toast({
          title: 'Error loading chats',
          description: 'Could not fetch chat channels',
          variant: 'destructive'
        });
      }
    };
    fetchChannels();
  }, [client, isReady]);

  // Clear selected channel when client disconnects
  useEffect(() => {
    if (!client || !isReady) {
      setSelectedChannel(null);
      setMessages([]);
    }
  }, [client, isReady]);

  // Fetch messages when channel is selected
  useEffect(() => {
    if (!selectedChannel || !client || !isReady) return;
    const loadMessages = async () => {
      try {
        await selectedChannel.watch();
        const state = selectedChannel.state;
        const messageArray = Object.values(state.messages || {});
        setMessages(messageArray);
      } catch (error) {
        console.error('Error loading messages:', error);
        toast({
          title: 'Error loading messages',
          description: 'Please refresh the page',
          variant: 'destructive'
        });
      }
    };
    loadMessages();

    // Listen for new messages
    const handleNewMessage = (event: any) => {
      setMessages(prev => [...prev, event.message]);
    };

    // Listen for typing events
    const handleTypingStart = (event: any) => {
      if (event.user?.id !== client.userID) {
        setTypingUsers(prev => [...prev.filter(u => u.id !== event.user?.id), event.user]);
      }
    };
    const handleTypingStop = (event: any) => {
      setTypingUsers(prev => prev.filter(u => u.id !== event.user?.id));
    };
    selectedChannel.on('message.new', handleNewMessage);
    selectedChannel.on('typing.start', handleTypingStart);
    selectedChannel.on('typing.stop', handleTypingStop);
    return () => {
      selectedChannel.off('message.new', handleNewMessage);
      selectedChannel.off('typing.start', handleTypingStart);
      selectedChannel.off('typing.stop', handleTypingStop);
    };
  }, [selectedChannel, client, isReady]);
  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end'
    });
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  useEffect(() => {
    const observer = new MutationObserver(scrollToBottom);
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true
      });
    }
    return () => observer.disconnect();
  }, [scrollToBottom]);
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedChannel || !client || !isReady) return;
    try {
      await selectedChannel.sendMessage({
        text: inputValue
      });
      setInputValue('');
      await selectedChannel.stopTyping();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error sending message',
        description: 'Please try again or refresh the page',
        variant: 'destructive'
      });
    }
  };
  const handleInputChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (selectedChannel && e.target.value.trim()) {
      await selectedChannel.keystroke();
    }
  };
  const getChannelName = (channel: Channel) => {
    const members = Object.values(channel.state.members);
    const otherMember = members.find((m: any) => m.user?.id !== client?.userID);
    return otherMember?.user?.name || otherMember?.user?.id || 'Unknown';
  };
  const getChannelAvatar = (channel: Channel) => {
    const members = Object.values(channel.state.members);
    const otherMember = members.find((m: any) => m.user?.id !== client?.userID);
    return otherMember?.user?.image || '';
  };
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  const handleStartDM = async (memberId: string) => {
    if (!client || !isReady) {
      toast({
        title: 'Chat not ready',
        description: 'Please wait for the chat to connect',
        variant: 'destructive'
      });
      return;
    }
    try {
      const members = [client.userID!, memberId].sort();
      const hash = members.map(id => id.replace(/-/g, '')).join('');
      const channelId = hash.substring(0, 63);
      const channel = client.channel('messaging', channelId, {
        members
      });
      await channel.watch();
      setSelectedChannel(channel);
      setActiveTab('chats');

      // Refresh channels list
      const filter = {
        type: 'messaging',
        members: {
          $in: [client.userID!]
        }
      };
      const sort = [{
        last_message_at: -1 as const
      }];
      const channelsResponse = await client.queryChannels(filter, sort, {
        limit: 20
      });
      setChannels(channelsResponse);
      toast({
        title: 'Chat opened',
        description: 'Direct message channel ready'
      });
    } catch (error: any) {
      console.error('Error starting DM:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start chat',
        variant: 'destructive'
      });
    }
  };
  if (!isReady || !client) {
    return <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading messenger...</p>
        </div>
      </div>;
  }
  return <div className="flex h-[calc(100vh-64px)] bg-gradient-to-br from-background via-background to-muted/20">
      {/* Sidebar */}
      <div className="w-80 border-r border-border/50 flex flex-col bg-card/95 backdrop-blur-sm">
        {/* Header */}
        <div className="p-6 border-b border-border/50">
          <h1 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Search conversations..." className="w-full pl-10 pr-4 py-2.5 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all bg-slate-50" />
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
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'chats' ? <div className="p-3 space-y-1">
              <ChatList>
                {channels.map(channel => {
              const channelName = getChannelName(channel);
              const channelAvatar = getChannelAvatar(channel);
              const lastMessage = channel.state.messages[channel.state.messages.length - 1];
              const lastMessageText = lastMessage?.text || 'No messages yet';
              const timestamp = lastMessage?.created_at ? new Date(lastMessage.created_at).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
              }) : '';
              return <ChatList.ChatListItem key={channel.id} avatar={channelAvatar} name={channelName} message={lastMessageText} timestamp={timestamp} selected={selectedChannel?.id === channel.id} onClick={() => {
                setSelectedChannel(channel);
                onChannelSelect?.(channel);
              }} />;
            })}
                {channels.length === 0 && <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No conversations yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Start chatting with your team</p>
                  </div>}
              </ChatList>
            </div> : <div className="p-3 space-y-1">
              {teamMembers.map(member => <button key={member.user_id} onClick={() => handleStartDM(member.user_id)} disabled={!isReady} className="w-full p-3.5 rounded-xl hover:bg-muted/60 transition-all flex items-center gap-3 text-left disabled:opacity-50 disabled:cursor-not-allowed group hover:shadow-sm border border-transparent hover:border-border/50">
                  <Avatar className="h-11 w-11 border-2 border-background shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-medium">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate text-foreground group-hover:text-primary transition-colors">
                      {member.full_name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                      <span className="capitalize">{member.role}</span>
                      <span className="text-muted-foreground/50">•</span>
                      <span>{member.email}</span>
                    </div>
                  </div>
                  <MessageCircle className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary flex-shrink-0 transition-colors" />
                </button>)}
              {teamMembers.length === 0 && <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No team members found</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Invite members to start collaborating</p>
                </div>}
            </div>}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-background to-muted/10">
        {selectedChannel ? <>
            {/* Chat Header */}
            <div className="p-5 border-b border-border/50 flex items-center justify-between bg-card/95 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <Avatar className="h-11 w-11 border-2 border-background shadow-md">
                  <AvatarImage src={getChannelAvatar(selectedChannel)} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-medium">
                    {getInitials(getChannelName(selectedChannel))}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-base">{getChannelName(selectedChannel)}</h2>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-muted-foreground">Active now</p>
                  </div>
                </div>
              </div>
              
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" ref={containerRef}>
              {/* Top gradient overlay */}
              <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-10" style={{
            background: 'linear-gradient(to bottom, hsl(var(--background)) 0%, hsla(var(--background), 0.95) 20%, hsla(var(--background), 0.8) 40%, hsla(var(--background), 0.4) 70%, hsla(var(--background), 0) 100%)'
          }} />
              
              <div className="p-8 min-h-full flex flex-col justify-end bg-slate-50">
                {messages.map((message, index) => {
              const isMe = message.user?.id === client.userID;
              const userName = message.user?.name || message.user?.id || 'Unknown';
              const userAvatar = message.user?.image || '';

              // Message grouping logic
              const previousMessage = index > 0 ? messages[index - 1] : null;
              const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
              const isContinuation = previousMessage?.user?.id === message.user?.id;
              const nextMessageSameSender = nextMessage?.user?.id === message.user?.id;
              const shouldShowAvatar = !nextMessageSameSender;
              const spacingClass = index === 0 ? "" : isContinuation ? "mt-1.5" : "mt-8";
              const roundedClass = isMe ? "rounded-bl-lg rounded-tl-lg rounded-tr-lg" // Right: rounded except bottom-right
              : "rounded-br-lg rounded-tl-lg rounded-tr-lg"; // Left: rounded except bottom-left

              return <div key={message.id} className={spacingClass}>
                      <div className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                        <div className={cn("flex items-end gap-3 max-w-[70%]", isMe ? "flex-row-reverse" : "")}>
                          {/* Avatar with animation */}
                          <AnimatePresence mode="wait">
                            {shouldShowAvatar ? <motion.div key="avatar" initial={{
                        opacity: 0,
                        scale: 0
                      }} animate={{
                        opacity: 1,
                        scale: 1
                      }} exit={{
                        opacity: 0,
                        scale: 0
                      }} transition={{
                        duration: 0.2
                      }}>
                                <Avatar className="w-8 h-8 flex-shrink-0 border-[1.5px] border-white shadow-sm">
                                  <AvatarImage src={userAvatar} />
                                  <AvatarFallback className={isMe ? "bg-primary text-primary-foreground" : "bg-muted"}>
                                    {getInitials(userName)}
                                  </AvatarFallback>
                                </Avatar>
                              </motion.div> : <div className="w-8 h-8 flex-shrink-0" key="spacer" />}
                          </AnimatePresence>
                          
                          {/* Message content */}
                          <motion.div initial={{
                      opacity: 0,
                      scale: 0.9
                    }} animate={{
                      opacity: 1,
                      scale: 1
                    }} transition={{
                      duration: 0.35,
                      ease: "easeOut"
                    }} className="flex flex-col" style={{
                      alignItems: isMe ? 'flex-end' : 'flex-start'
                    }}>
                            {/* Username (only for first message in group) */}
                            {!isContinuation && <motion.div style={{
                        color: 'hsl(var(--muted-foreground))'
                      }} initial={{
                        opacity: 0
                      }} animate={{
                        opacity: 1
                      }} transition={{
                        delay: 0.15,
                        duration: 0.25
                      }} className="text-xs mb-1 px-1 bg-slate-50">
                                {userName}
                              </motion.div>}
                            
                            {/* Message bubble */}
                            <div className={cn(roundedClass, "p-4 border-solid shadow-sm", isMe ? "bg-blue-50 text-gray-900 border border-blue-100" : "bg-card text-card-foreground border border-border/50")}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {message.text}
                              </p>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </div>;
            })}
                
                {/* Typing indicator */}
                {typingUsers.length > 0 && <motion.div initial={{
              opacity: 0,
              y: 10
            }} animate={{
              opacity: 1,
              y: 0
            }} exit={{
              opacity: 0,
              y: 10
            }} className="mt-4">
                    <div className="flex items-end gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0 border-[1.5px] border-white shadow-sm">
                        <AvatarImage src={typingUsers[0]?.image} />
                        <AvatarFallback className="bg-muted">
                          {getInitials(typingUsers[0]?.name || 'User')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-card border border-border/50 rounded-br-lg rounded-tl-lg rounded-tr-lg p-3 shadow-sm">
                        <MessageLoading />
                      </div>
                    </div>
                  </motion.div>}
                
                <div ref={messagesEndRef} className="h-8" />
              </div>
            </div>

            {/* Input Area */}
            <div className="p-5 border-t border-border/50 bg-card/95 backdrop-blur-sm">
              <div className="flex gap-3 items-end">
                <ChatInput value={inputValue} onChange={handleInputChange} onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }} placeholder="Type your message..." className="flex-1 border-border/50 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none bg-background" />
                <Button onClick={handleSendMessage} size="icon" className="rounded-full h-11 w-11 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 bg-gradient-to-r from-primary to-primary/80" disabled={!inputValue.trim() || !client || !isReady}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </> : <div className="flex-1 flex items-center justify-center text-center px-6">
            <div className="max-w-md space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full"></div>
                <div className="relative text-7xl mb-6 animate-pulse">💬</div>
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Your Messages
                </h2>
                <p className="text-muted-foreground text-base">
                  Select a conversation from the sidebar or start a new chat with a team member
                </p>
              </div>
              <div className="pt-4">
                <Button variant="outline" className="rounded-full border-border/50 hover:bg-muted/60" onClick={() => setActiveTab('team')}>
                  <Users className="h-4 w-4 mr-2" />
                  Browse Team
                </Button>
              </div>
            </div>
          </div>}
      </div>
    </div>;
};
export default ModernMessenger;