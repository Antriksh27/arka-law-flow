
import React from 'react';
import { Bell, Settings, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
const Header = () => {
  const {
    user,
    signOut
  } = useAuth();
  return <header className="border-b border-[#E5E7EB] px-8 py-4 bg-slate-900">
      <div className="flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-4">
          <img src="/lovable-uploads/89ea18cf-8c73-4793-9dcc-1a192855a630.png" alt="HRU Legal" className="h-[3.75rem] w-auto" />
        </div>
        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="focus:ring-[#111827] relative bg-slate-200 hover:bg-slate-100 text-slate-900">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#6B7280] border-2 border-white rounded-full"></span>
          </Button>
          <Button variant="ghost" size="icon" className="focus:ring-[#111827] bg-slate-50 text-slate-900">
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
