import { User, LogOut, Menu, Settings, Bell, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationDialog } from '@/components/notifications/NotificationDialog';
import { MessagesDialog } from '@/components/messages/MessagesDialog';
import { useCometChat } from '@/hooks/useCometChat';
import { CometChat } from '@cometchat/chat-sdk-javascript';

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { unreadCount } = useNotifications();
  const { isCometChatReady } = useCometChat();

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!isCometChatReady) return;
      
      try {
        const loggedInUser = await CometChat.getLoggedinUser();
        if (!loggedInUser) return;

        const count = await CometChat.getUnreadMessageCount() as { users?: Record<string, number>; groups?: Record<string, number> };
        const userCount = count.users ? Object.values(count.users).reduce((sum, c) => sum + c, 0) : 0;
        const groupCount = count.groups ? Object.values(count.groups).reduce((sum, c) => sum + c, 0) : 0;
        setMessageUnreadCount(userCount + groupCount);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    
    // Message listener for real-time updates
    const listenerID = 'header_message_listener';
    if (isCometChatReady) {
      const messageListener = new CometChat.MessageListener({
        onTextMessageReceived: () => fetchUnreadCount(),
        onMediaMessageReceived: () => fetchUnreadCount(),
      });
      CometChat.addMessageListener(listenerID, messageListener);
    }

    return () => {
      clearInterval(interval);
      CometChat.removeMessageListener(listenerID);
    };
  }, [isCometChatReady]);
  
  return <div className="flex items-center justify-between gap-3 w-full">
          {/* Mobile: Hamburger Menu */}
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onMenuClick}
              className="text-foreground hover:bg-accent md:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          
          {/* Desktop: Logo */}
          {!isMobile && <div className="flex items-center">
              <img src="/lovable-uploads/89ea18cf-8c73-4793-9dcc-1a192855a630.png" alt="HRU Legal" className="h-20 w-auto" />
            </div>}
          
          {/* Mobile: Logo */}
          {isMobile && <div className="hidden flex items-center">
              <img src="/lovable-uploads/89ea18cf-8c73-4793-9dcc-1a192855a630.png" alt="HRU Legal" className="h-10 w-auto" />
            </div>}

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 ml-auto">
          {/* Messages Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowMessages(true)}
            className="relative bg-slate-50 hover:bg-slate-200 text-slate-900"
          >
            <MessageSquare className="w-5 h-5" />
            {messageUnreadCount > 0 && (
              <Badge 
                variant="error" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {messageUnreadCount > 9 ? '9+' : messageUnreadCount}
              </Badge>
            )}
          </Button>
          
          <MessagesDialog 
            isOpen={showMessages} 
            onClose={() => setShowMessages(false)} 
          />
          
          {/* Notification Bell */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowNotifications(true)}
            className="relative bg-slate-50 hover:bg-slate-200 text-slate-900"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="error" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
          
          <NotificationDialog 
            isOpen={showNotifications} 
            onClose={() => setShowNotifications(false)} 
          />
          
          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="bg-slate-50 hover:bg-slate-200 text-slate-900 focus:ring-[#111827]">
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white shadow-lg border border-slate-200 z-50">
              <div className="px-3 py-2 text-sm text-slate-500 border-b border-slate-200">
                {user?.email}
              </div>
              <DropdownMenuItem onClick={() => navigate('/notifications')} className="hover:bg-accent focus:bg-accent cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Notification Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive hover:text-destructive hover:bg-destructive/10 focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
    </div>;
};
export default Header;
