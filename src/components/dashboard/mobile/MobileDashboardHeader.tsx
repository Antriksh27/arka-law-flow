import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { CometChat } from '@cometchat/chat-sdk-javascript';

interface MobileDashboardHeaderProps {
  userName: string;
}

export const MobileDashboardHeader: React.FC<MobileDashboardHeaderProps> = ({ userName }) => {
  const navigate = useNavigate();
  const firstName = userName.split(' ')[0];
  const { unreadCount: notificationCount } = useNotifications();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        const count = await CometChat.getUnreadMessageCount() as { users?: Record<string, number>; groups?: Record<string, number> };
        const userCount = count.users ? Object.values(count.users).reduce((sum, c) => sum + c, 0) : 0;
        const groupCount = count.groups ? Object.values(count.groups).reduce((sum, c) => sum + c, 0) : 0;
        setUnreadMessageCount(userCount + groupCount);
      } catch (error) {
        console.log('Could not fetch unread message count');
      }
    };

    fetchUnreadMessages();
    const interval = setInterval(fetchUnreadMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCount = (count: number) => count > 99 ? '99+' : count.toString();

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-4 safe-area-top">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="text-xl font-bold text-foreground">{firstName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/messages')}
            className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all"
            aria-label="Messages"
          >
            <MessageCircle className="w-5 h-5 text-slate-700" />
            {unreadMessageCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-semibold rounded-full">
                {formatCount(unreadMessageCount)}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-700" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-semibold rounded-full">
                {formatCount(notificationCount)}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
