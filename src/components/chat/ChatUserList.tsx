import React, { useEffect, useState } from 'react';
import { CometChat, createCometChatUser } from '@/lib/cometchat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Users, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatUserListProps {
  onSelectUser: (user: CometChat.User) => void;
  selectedUserId: string | null;
}

export const ChatUserList: React.FC<ChatUserListProps> = ({ onSelectUser, selectedUserId }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<CometChat.User[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadUsers();
    
    // Listen for real-time messages to update unread counts
    const listenerID = 'user_list_listener';
    
    CometChat.addMessageListener(
      listenerID,
      new CometChat.MessageListener({
        onTextMessageReceived: (message: CometChat.TextMessage) => {
          const senderId = message.getSender().getUid();
          setUnreadCounts(prev => ({
            ...prev,
            [senderId]: (prev[senderId] || 0) + 1
          }));
        }
      })
    );

    return () => {
      CometChat.removeMessageListener(listenerID);
    };
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Fetch real users from Supabase team_members table
      const { data: teamMembers, error } = await supabase
        .from('team_members')
        .select('user_id, full_name, email, role')
        .neq('user_id', currentUser?.id || ''); // Exclude current user
      
      if (error) throw error;

      const cometChatUsers: CometChat.User[] = [];

      // For each team member, ensure they exist in CometChat and get their user object
      for (const member of teamMembers || []) {
        try {
          // Try to get existing CometChat user
          let cometUser = await CometChat.getUser(member.user_id);
          cometChatUsers.push(cometUser);
        } catch (err: any) {
          // If user doesn't exist in CometChat, create them
          if (err?.code === 'ERR_UID_NOT_FOUND') {
            try {
              const newUser = await createCometChatUser(
                member.user_id, 
                member.full_name || member.email || 'Unknown User'
              );
              cometChatUsers.push(newUser);
            } catch (createErr) {
              console.error('Error creating CometChat user:', createErr);
            }
          }
        }
      }

      setUsers(cometChatUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: CometChat.User) => {
    onSelectUser(user);
    // Clear unread count for this user
    setUnreadCounts(prev => ({
      ...prev,
      [user.getUid()]: 0
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="px-4 py-5 border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Direct Messages</h2>
            <p className="text-xs text-muted-foreground">Team members</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {users.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="flex justify-center mb-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground">No team members</p>
              <p className="text-xs text-muted-foreground mt-1">Users will appear here</p>
            </div>
          ) : (
            users.map((user) => {
              const isSelected = user.getUid() === selectedUserId;
              const unreadCount = unreadCounts[user.getUid()] || 0;
              const isOnline = user.getStatus() === 'online';

              return (
                <div
                  key={user.getUid()}
                  onClick={() => handleUserSelect(user)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1 ${
                    isSelected 
                      ? 'bg-primary/10 shadow-sm' 
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={`${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'
                      } font-medium`}>
                        {user.getName().charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-card shadow-sm" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium truncate ${
                        isSelected ? 'text-foreground' : 'text-foreground'
                      }`}>
                        {user.getName()}
                      </p>
                      {unreadCount > 0 && (
                        <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize flex items-center gap-1.5 mt-0.5">
                      {isOnline && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
                      {isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
