
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
          <img src="/lovable-uploads/a3cdf643-6752-4129-b6b5-dd61377068d4.png" alt="HRU Legal" className="h-10 w-auto" />
        </div>
        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="focus:ring-[#111827] relative text-slate-50 bg-amber-500 hover:bg-amber-500">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#6B7280] border-2 border-white rounded-full"></span>
          </Button>
          <Button variant="ghost" size="icon" className="focus:ring-[#111827] text-slate-50 bg-amber-500 hover:bg-amber-500">
            <Settings className="w-5 h-5" />
          </Button>
          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-50 bg-amber-500 hover:bg-amber-500 focus:ring-[#111827]">
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
