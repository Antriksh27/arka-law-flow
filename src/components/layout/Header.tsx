
import React from 'react';
import { Bell, Settings, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/a3cdf643-6752-4129-b6b5-dd61377068d4.png" 
            alt="HRU Legal" 
            className="h-10 w-auto"
          />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-gray-100 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full border-2 border-white"></span>
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-gray-100">
            <Settings className="w-5 h-5" />
          </Button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-gray-100">
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                {user?.email}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
