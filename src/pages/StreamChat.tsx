import React, { useState, useEffect } from 'react';
import { Chat, Channel, ChannelHeader, MessageInput, MessageList, Thread, Window, ChannelList } from 'stream-chat-react';
import { useStreamChat } from '@/contexts/StreamChatContext';
import { MessageSquare, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import 'stream-chat-react/dist/css/v2/index.css';
import './StreamChatStyled.css';

interface TeamMember {
  user_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

const StreamChatPage: React.FC = () => {
  const { client, isReady } = useStreamChat();
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  useEffect(() => {
    const fetchAndSyncTeamMembers = async () => {
      if (!client) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Fetch team members from the same firm
      const { data: currentMember } = await supabase
        .from('team_members')
        .select('firm_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!currentMember?.firm_id) {
        console.warn('No firm membership found for current user');
        setTeamMembers([]);
        return;
      }
      
      // Fetch firm members via secure RPC (bypasses RLS safely)
      const { data: rpcData, error: rpcErr } = await supabase
        .rpc('get_firm_members_for_chat');

      if (rpcErr) {
        console.error('Error fetching firm members via RPC:', rpcErr);
        setTeamMembers([]);
        return;
      }

      const formattedData: TeamMember[] = (rpcData || []).map((m: any) => ({
        user_id: m.user_id,
        profiles: {
          full_name: m.full_name || m.email || 'User',
          email: m.email || '',
        },
      }));

      setTeamMembers(formattedData);
    };

    if (client?.userID) {
      fetchAndSyncTeamMembers();
    }
  }, [client]);

  const handleCreateDM = async (otherUserId: string) => {
    if (!client) return;
    
    setIsCreatingChat(true);
    try {
      const members = [client.userID!, otherUserId].sort();
      
      // Create a shorter channel ID by hashing the user IDs (max 64 chars)
      // Remove hyphens from UUIDs and concatenate: 32+32 = 64 chars total
      const hash = members.map(id => id.replace(/-/g, '')).join('');
      const channelId = hash.substring(0, 63); // Ensure under 64 char limit
      
      const channel = client.channel('messaging', channelId, {
        members,
      });
      
      await channel.watch();
      setSelectedChannel(channel);
      setIsNewChatOpen(false);
      
      toast({
        title: 'Chat opened',
        description: 'Direct message channel ready',
      });
    } catch (error: any) {
      console.error('Error creating DM:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create chat',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingChat(false);
    }
  };

  if (!isReady || !client) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-lg text-muted-foreground">Connecting to chat service...</p>
        </div>
      </div>
    );
  }

  const filters = { 
    type: 'messaging',
    members: { $in: [client.userID!] }
  };
  
  const sort = { last_message_at: -1 as const };

  return (
    <div className="h-[calc(100vh-64px)] bg-background">
      <Chat client={client} theme="str-chat__theme-light">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-80 border-r border-border bg-card flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-border">
              <h1 className="text-2xl font-semibold text-foreground mb-2">Messages</h1>
              <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="default">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    New Chat
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Start a new chat</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {teamMembers.map((member) => (
                      <button
                        key={member.user_id}
                        onClick={() => handleCreateDM(member.user_id)}
                        disabled={isCreatingChat}
                        className="w-full p-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-3 text-left"
                      >
                        <Avatar>
                          <AvatarFallback>
                            {(member.profiles?.full_name || member.profiles?.email || 'U')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {member.profiles?.full_name || member.profiles?.email || 'Unknown User'}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {member.profiles?.email}
                          </div>
                        </div>
                      </button>
                    ))}
                    {teamMembers.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No active team members in your firm
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Channel List */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Direct Messages
                  </h2>
                </div>
                <ChannelList
                  filters={filters}
                  sort={sort}
                  options={{ limit: 10 }}
                  Preview={(props: any) => {
                    const channelName = props.channel.data?.name || props.channel.data?.id || 'Unnamed Channel';
                    const firstLetter = (channelName as string)[0]?.toUpperCase() || 'C';
                    
                    return (
                      <div
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedChannel?.id === props.channel.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => {
                          props.setActiveChannel?.(props.channel);
                          setSelectedChannel(props.channel);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                            {firstLetter}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {channelName}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {props.latestMessage || 'No messages yet'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
              </div>

              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Case Chats
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">Coming soon...</p>
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedChannel ? (
              <Channel channel={selectedChannel}>
                <Window>
                  <ChannelHeader />
                  <MessageList />
                  <MessageInput />
                </Window>
                <Thread />
              </Channel>
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div className="space-y-4 max-w-md px-6">
                  <div className="text-6xl">💬</div>
                  <h2 className="text-2xl font-semibold text-foreground">
                    Select a chat to start messaging
                  </h2>
                  <p className="text-muted-foreground">
                    Choose a conversation from the sidebar or start a new chat
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Chat>
    </div>
  );
};

export default StreamChatPage;
