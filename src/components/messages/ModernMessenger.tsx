import React, { useState, useEffect } from 'react';
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from '@/components/ui/chat-bubble';
import { ChatInput } from '@/components/ui/chat-input';
import { ChatMessageList } from '@/components/ui/chat-message-list';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Search, Phone, Video, Info, Users, MessageCircle } from 'lucide-react';
import { useStreamChat } from '@/contexts/StreamChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ChatList from './ui/ChatList';
import { Channel } from 'stream-chat';
import { StreamChat } from 'stream-chat';

interface TeamMember {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
}

interface ModernMessengerProps {
  onChannelSelect?: (channel: any) => void;
}

const ModernMessenger: React.FC<ModernMessengerProps> = ({ onChannelSelect }) => {
  const { client, isReady } = useStreamChat();
  const { user } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeTab, setActiveTab] = useState<'chats' | 'team'>('chats');

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!user) return;

      try {
        // Get current user's firm
        const { data: currentMember } = await supabase
          .from('team_members')
          .select('firm_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!currentMember?.firm_id) return;

        // Fetch all team members from the same firm
        const { data: members, error } = await supabase
          .from('team_members')
          .select(`
            user_id,
            role,
            profiles!inner(
              full_name,
              email
            )
          `)
          .eq('firm_id', currentMember.firm_id)
          .neq('user_id', user.id); // Exclude current user

        if (error) throw error;

        const formattedMembers: TeamMember[] = (members || []).map((m: any) => ({
          user_id: m.user_id,
          full_name: m.profiles?.full_name || m.profiles?.email || 'Unknown',
          email: m.profiles?.email || '',
          role: m.role,
        }));

        setTeamMembers(formattedMembers);
      } catch (error) {
        console.error('Error fetching team members:', error);
      }
    };

    fetchTeamMembers();
  }, [user]);

  // Fetch channels
  useEffect(() => {
    if (!client || !isReady) return;

    const fetchChannels = async () => {
      const filter = { 
        type: 'messaging',
        members: { $in: [client.userID!] }
      };
      const sort = [{ last_message_at: -1 as const }];
      
      const channelsResponse = await client.queryChannels(filter, sort, { limit: 20 });
      setChannels(channelsResponse);
    };

    fetchChannels();
  }, [client, isReady]);

  // Fetch messages when channel is selected
  useEffect(() => {
    if (!selectedChannel) return;

    const loadMessages = async () => {
      await selectedChannel.watch();
      const state = selectedChannel.state;
      const messageArray = Object.values(state.messages || {});
      setMessages(messageArray);
    };

    loadMessages();

    // Listen for new messages
    const handleNewMessage = (event: any) => {
      setMessages(prev => [...prev, event.message]);
    };

    selectedChannel.on('message.new', handleNewMessage);

    return () => {
      selectedChannel.off('message.new', handleNewMessage);
    };
  }, [selectedChannel]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedChannel) return;

    try {
      await selectedChannel.sendMessage({
        text: inputValue,
      });
      setInputValue('');
    } catch (error) {
      console.error('Error sending message:', error);
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
    if (!client) return;

    try {
      const members = [client.userID!, memberId].sort();
      const hash = members.map(id => id.replace(/-/g, '')).join('');
      const channelId = hash.substring(0, 63);
      
      const channel = client.channel('messaging', channelId, {
        members,
      });
      
      await channel.watch();
      setSelectedChannel(channel);
      setActiveTab('chats');
      
      // Refresh channels list
      const filter = { 
        type: 'messaging',
        members: { $in: [client.userID!] }
      };
      const sort = [{ last_message_at: -1 as const }];
      const channelsResponse = await client.queryChannels(filter, sort, { limit: 20 });
      setChannels(channelsResponse);
      
      toast({
        title: 'Chat opened',
        description: 'Direct message channel ready',
      });
    } catch (error: any) {
      console.error('Error starting DM:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start chat',
        variant: 'destructive',
      });
    }
  };

  if (!isReady || !client) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading messenger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col bg-card">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h1 className="text-2xl font-semibold mb-3">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search messages"
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border bg-card">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'chats'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            Chats
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'team'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            Team ({teamMembers.length})
          </button>
        </div>

        {/* Chat List or Team List */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'chats' ? (
            <div className="p-2">
              <ChatList>
                {channels.map((channel) => {
                  const channelName = getChannelName(channel);
                  const channelAvatar = getChannelAvatar(channel);
                  const lastMessage = channel.state.messages[channel.state.messages.length - 1];
                  const lastMessageText = lastMessage?.text || 'No messages yet';
                  const timestamp = lastMessage?.created_at 
                    ? new Date(lastMessage.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                    : '';

                  return (
                    <ChatList.ChatListItem
                      key={channel.id}
                      avatar={channelAvatar}
                      name={channelName}
                      message={lastMessageText}
                      timestamp={timestamp}
                      selected={selectedChannel?.id === channel.id}
                      onClick={() => {
                        setSelectedChannel(channel);
                        onChannelSelect?.(channel);
                      }}
                    />
                  );
                })}
                {channels.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No conversations yet
                  </div>
                )}
              </ChatList>
            </div>
          ) : (
            <div className="p-2">
              <div className="space-y-1">
                {teamMembers.map((member) => (
                  <button
                    key={member.user_id}
                    onClick={() => handleStartDM(member.user_id)}
                    className="w-full p-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-3 text-left"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(member.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate text-foreground">
                        {member.full_name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)} • {member.email}
                      </div>
                    </div>
                    <MessageCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
                {teamMembers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No team members found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-card">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getChannelAvatar(selectedChannel)} />
                  <AvatarFallback>{getInitials(getChannelName(selectedChannel))}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{getChannelName(selectedChannel)}</h2>
                  <p className="text-sm text-muted-foreground">Active now</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Info className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ChatMessageList className="flex-1 p-4">
              {messages.map((message) => {
                const isMe = message.user?.id === client.userID;
                const userName = message.user?.name || message.user?.id || 'Unknown';
                const userAvatar = message.user?.image || '';

                return (
                  <ChatBubble key={message.id} variant={isMe ? 'sent' : 'received'}>
                    {!isMe && (
                      <ChatBubbleAvatar
                        src={userAvatar}
                        fallback={getInitials(userName)}
                      />
                    )}
                    <ChatBubbleMessage variant={isMe ? 'sent' : 'received'}>
                      {message.text}
                    </ChatBubbleMessage>
                  </ChatBubble>
                );
              })}
            </ChatMessageList>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex gap-2 items-center">
                <ChatInput
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  size="icon"
                  className="rounded-full"
                  disabled={!inputValue.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center px-6">
            <div className="max-w-md">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-semibold mb-2">Your Messages</h2>
              <p className="text-muted-foreground">
                Select a conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernMessenger;
