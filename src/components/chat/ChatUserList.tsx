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
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Messages</h2>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No users available</p>
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
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-primary/10 border-l-4 border-primary' 
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {user.getName().charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{user.getName()}</p>
                      {unreadCount > 0 && (
                        <Badge variant="default" className="ml-2">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
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
