import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Bell, Settings, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { useNotifications } from '@/hooks/useNotifications';

const OfficeStaffHeader = () => {
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', href: '/staff/dashboard' },
    { name: 'Cases', href: '/staff/cases' },
    { name: 'Clients', href: '/staff/clients' },
    { name: 'Hearings', href: '/staff/hearings' },
    { name: 'Documents', href: '/staff/documents' },
    { name: 'Tasks', href: '/staff/tasks' },
    { name: 'Instructions', href: '/staff/instructions' },
    { name: 'Invoices', href: '/staff/invoices' },
  ];

  const isActive = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <header className="border-b border-[#E5E7EB] bg-slate-900">
      {/* Top row with logo and actions */}
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <img src="/lovable-uploads/89ea18cf-8c73-4793-9dcc-1a192855a630.png" alt="HRU Legal" className="h-[4.125rem] w-auto" />
            <div className="text-white">
              <h1 className="text-xl font-bold">Office Staff Portal</h1>
              <p className="text-sm text-slate-300">Case Management System</p>
            </div>
          </div>
          
          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="focus:ring-[#111827] relative bg-slate-200 hover:bg-slate-100 text-slate-900"
                onClick={() => setIsNotificationPanelOpen(!isNotificationPanelOpen)}
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
      </div>

      {/* Navigation tabs */}
      <div className="px-8 bg-slate-800">
        <nav className="flex space-x-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-white text-slate-900 border-b-2 border-primary'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default OfficeStaffHeader;