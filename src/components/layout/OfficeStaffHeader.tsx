import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Settings, User, LogOut, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ChatDropdown } from '@/components/messages/ChatDropdown';
import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { Badge } from '@/components/ui/badge';
const OfficeStaffHeader = () => {
  const {
    user,
    signOut
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useNotifications();
  const navItems = [{
    name: 'Dashboard',
    href: '/'
  }, {
    name: 'Cases',
    href: '/cases'
  }, {
    name: 'Clients',
    href: '/clients'
  }, {
    name: 'Hearings',
    href: '/hearings'
  }, {
    name: 'Documents',
    href: '/documents'
  }, {
    name: 'Tasks',
    href: '/tasks'
  }, {
    name: 'Invoices',
    href: '/invoices'
  }, {
    name: 'Chat',
    href: '/chat'
  }];
  const isActive = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  return <header className="border-b border-[#E5E7EB] bg-slate-900">
      {/* Top row with logo and actions */}
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <img src="/lovable-uploads/89ea18cf-8c73-4793-9dcc-1a192855a630.png" alt="HRU Legal" className="h-[4.125rem] w-auto" />
            <div className="text-white">
              <h1 className="text-xl font-bold">Office Staff Portal</h1>
            </div>
          </div>
          
          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <ChatDropdown />
            
            {/* Notification Bell */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                className="bg-gray-50 hover:bg-gray-200 text-gray-900 focus:ring-[#111827]"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="error" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
              <NotificationPanel 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)} 
              />
            </div>
            
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="bg-gray-50 hover:bg-gray-200 text-gray-900 focus:ring-[#111827]">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-slate-50">
                <div className="px-2 py-1.5 text-sm text-muted-foreground bg-slate-50">
                  {user?.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/notifications')} className="bg-slate-50">
                  <Settings className="w-4 h-4 mr-2" />
                  Notification Settings
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
      </div>

      {/* Navigation tabs */}
      <div className="px-8 bg-slate-800">
        <nav className="flex space-x-1">
          {navItems.map(item => <NavLink key={item.name} to={item.href} className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${isActive(item.href) ? 'bg-white text-slate-900 border-b-2 border-primary' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>
              {item.name}
            </NavLink>)}
        </nav>
      </div>
    </header>;
};
export default OfficeStaffHeader;