import { User, LogOut, Menu, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import KnockNotificationInbox from '@/components/notifications/KnockNotificationInbox';
import { ChatDropdown } from '@/components/messages/ChatDropdown';
import { useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
const Header = () => {
  const {
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const sidebar = isMobile ? useSidebar() : null;
  return <div className="flex items-center justify-between gap-3 w-full">
          {/* Mobile: Hamburger Menu */}
          {isMobile && sidebar && <Button variant="ghost" size="icon" onClick={() => sidebar.toggleSidebar()} className="text-foreground hover:bg-accent sm:hidden">
              <Menu className="w-5 h-5" />
            </Button>}

          {/* Desktop: Logo */}
          {!isMobile && <div className="flex items-center">
              <img src="/lovable-uploads/89ea18cf-8c73-4793-9dcc-1a192855a630.png" alt="HRU Legal" className="h-20 w-" />
            </div>}

          {/* Right Side Actions */}
          <div className="flex items-center gap-3 ml-auto">
          <ChatDropdown />
          <KnockNotificationInbox />
          
          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="bg-gray-50 hover:bg-gray-200 text-gray-900 focus:ring-[#111827]">
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white shadow-lg border border-[#E5E7EB] z-50">
              <div className="px-3 py-2 text-sm text-[#6B7280] border-b border-[#E5E7EB]">
                {user?.email}
              </div>
              <DropdownMenuItem onClick={() => navigate('/notifications')} className="hover:bg-accent focus:bg-accent cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Notification Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
    </div>;
};
export default Header;