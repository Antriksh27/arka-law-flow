import React, { useState, useEffect } from 'react';
import { Bell, Settings, User, LogOut, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationSounds from '@/lib/notificationSounds';
import { sendTestNotification } from '@/utils/testNotification';
const Header = () => {
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);

  // Initialize audio context on first user interaction
  const initializeAudio = async () => {
    if (!audioInitialized) {
      console.log('🎵 Initializing audio context from user interaction...');
      const success = await NotificationSounds.testSound();
      if (success) {
        setAudioInitialized(true);
        console.log('🎵 Audio context initialized successfully');
      }
    }
  };

  const handleNotificationClick = async () => {
    await initializeAudio();
    setIsNotificationPanelOpen(!isNotificationPanelOpen);
  };

  const handleTestSound = async () => {
    console.log('🧪 Testing notification sound...');
    await initializeAudio();
    try {
      await NotificationSounds.testSound();
      console.log('🧪 Test sound completed');
    } catch (error) {
      console.error('🧪 Test sound failed:', error);
    }
  };

  const handleTestNotification = async () => {
    if (!user?.id) return;
    
    console.log('🧪 Sending test notification...');
    await initializeAudio();
    
    try {
      await sendTestNotification(user.id);
      console.log('🧪 Test notification sent successfully');
    } catch (error) {
      console.error('🧪 Test notification failed:', error);
    }
  };
  return <header className="border-b border-[#E5E7EB] px-8 py-4 bg-slate-900">
      <div className="flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-4">
          <img src="/lovable-uploads/89ea18cf-8c73-4793-9dcc-1a192855a630.png" alt="HRU Legal" className="h-[4.125rem] w-auto" />
        </div>
        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="focus:ring-[#111827] relative bg-slate-200 hover:bg-slate-100 text-slate-900"
              onClick={handleNotificationClick}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
            <NotificationPanel 
              isOpen={isNotificationPanelOpen}
              onClose={() => setIsNotificationPanelOpen(false)}
            />
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="focus:ring-[#111827] bg-slate-50 text-slate-900" 
            onClick={handleTestSound}
            title="Test notification sound"
          >
            <Settings className="w-5 h-5" />
          </Button>
          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-gray-50 hover:bg-gray-200 text-gray-900 focus:ring-[#111827]"
              >
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-50">
              <div className="px-2 py-1.5 text-sm text-muted-foreground bg-slate-50">
                {user?.email}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleTestNotification} 
                className="text-blue-600 focus:text-blue-600 bg-slate-50"
              >
                <TestTube className="w-4 h-4 mr-2" />
                Test Notification
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-red-600 focus:text-red-600 bg-slate-50">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>;
};
export default Header;
