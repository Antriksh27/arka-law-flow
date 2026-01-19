import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, MessageCircle, Bell, User, Settings, LogOut } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface MobileDashboardHeaderProps {
  userName: string;
}

export const MobileDashboardHeader: React.FC<MobileDashboardHeaderProps> = ({ userName }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { openSidebar } = useSidebarContext();
  const firstName = userName.split(' ')[0];
  const { unreadCount: notificationCount } = useNotifications();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        // First check if user is logged in to CometChat
        const loggedInUser = await CometChat.getLoggedinUser();
        if (!loggedInUser) {
          console.log('CometChat user not logged in, skipping unread count fetch');
          return;
        }

        const count = await CometChat.getUnreadMessageCount() as { users?: Record<string, number>; groups?: Record<string, number> };
        const userCount = count.users ? Object.values(count.users).reduce((sum, c) => sum + c, 0) : 0;
        const groupCount = count.groups ? Object.values(count.groups).reduce((sum, c) => sum + c, 0) : 0;
        const totalCount = userCount + groupCount;
        console.log('📧 Unread message count:', { userCount, groupCount, totalCount });
        setUnreadMessageCount(totalCount);
      } catch (error) {
        console.error('Could not fetch unread message count:', error);
      }
    };

    // Small delay to ensure CometChat is initialized
    const timeout = setTimeout(fetchUnreadMessages, 1000);
    const interval = setInterval(fetchUnreadMessages, 30000);
    
    // Also listen for new messages to update count
    const listenerID = 'mobile_header_message_listener';
    const messageListener = new CometChat.MessageListener({
      onTextMessageReceived: () => {
        console.log('📧 New message received, refreshing count');
        fetchUnreadMessages();
      },
      onMediaMessageReceived: () => {
        console.log('📧 New media message received, refreshing count');
        fetchUnreadMessages();
      },
    });
    
    CometChat.addMessageListener(listenerID, messageListener);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      CometChat.removeMessageListener(listenerID);
    };
  }, []);

  const formatCount = (count: number) => count > 99 ? '99+' : count.toString();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 safe-area-top">
      <div className="flex items-center justify-between">
        {/* Left: Hamburger + Greeting */}
        <div className="flex items-center gap-3">
          <button
            onClick={openSidebar}
            className="p-2 rounded-lg hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <p className="text-xs text-muted-foreground">Welcome back,</p>
            <h1 className="text-base font-semibold text-foreground">{firstName}</h1>
          </div>
        </div>

        {/* Right: Messages, Notifications, Profile */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/messages')}
            className="relative p-2 rounded-lg hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Messages"
          >
            <MessageCircle className="w-5 h-5 text-slate-600" />
            {unreadMessageCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full">
                {formatCount(unreadMessageCount)}
              </span>
            )}
          </button>
          
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-lg hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full">
                {formatCount(notificationCount)}
              </span>
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg hover:bg-slate-100 active:scale-95 transition-all">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/notifications')}>
                <Settings className="mr-2 h-4 w-4" />
                Notification Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
