import { User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import KnockNotificationInbox from '@/components/notifications/KnockNotificationInbox';
import { ChatDropdown } from '@/components/messages/ChatDropdown';
const Header = () => {
  const { user, signOut } = useAuth();
  return <div className="flex items-center justify-end gap-3 w-full">
          <ChatDropdown />
          <KnockNotificationInbox />
          
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
            <DropdownMenuContent align="end" className="w-56 bg-white shadow-lg border border-[#E5E7EB] z-50">
              <div className="px-3 py-2 text-sm text-[#6B7280] border-b border-[#E5E7EB]">
                {user?.email}
              </div>
              <DropdownMenuItem onClick={signOut} className="text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
    </div>;
};
export default Header;
