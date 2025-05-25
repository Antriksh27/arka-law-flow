
import React from 'react';
import { Bell, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-3">
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
          <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-800 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></span>
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-800">
            <Settings className="w-5 h-5" />
          </Button>

          {/* User Profile */}
          <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-800">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
