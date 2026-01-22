import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, Calendar, UserPlus, CalendarPlus, LayoutDashboard, Phone, Settings, LogOut, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
const ReceptionistSidebar = () => {
  const location = useLocation();
  const {
    signOut
  } = useAuth();
  const menuItems = [{
    name: 'Dashboard',
    href: '/reception/home',
    icon: Home
  }, {
    name: 'Appointments',
    href: '/reception/appointments',
    icon: Calendar
  }, {
    name: 'Contacts',
    href: '/reception/contacts',
    icon: Users
  }, {
    name: 'Daily Board',
    href: '/daily-board',
    icon: LayoutDashboard
  }, {
    name: 'Chat',
    href: '/chat',
    icon: MessageSquare
  }];
  const quickActions = [{
    name: 'New Contact',
    href: '/reception/contacts?action=new',
    icon: UserPlus
  }, {
    name: 'Book Appointment',
    href: '/reception/appointments?action=new',
    icon: CalendarPlus
  }];
  const isActive = (path: string) => location.pathname === path;
  return <div className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col h-full">
      {/* Logo */}
      

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {menuItems.map(item => <NavLink key={item.name} to={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.href) ? 'bg-[#E0E7FF] text-[#1E3A8A]' : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]'}`}>
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>)}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">
            Quick Actions
          </h3>
          <div className="space-y-2">
            {quickActions.map(action => <NavLink key={action.name} to={action.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors">
                <action.icon className="w-4 h-4" />
                {action.name}
              </NavLink>)}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 p-4 bg-[#F9FAFB] rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4 text-[#1E3A8A]" />
            <span className="text-sm font-medium text-[#111827]">Need Help?</span>
          </div>
          <p className="text-xs text-[#6B7280] mb-3">
            Contact IT support for technical assistance
          </p>
          <Button variant="outline" size="sm" className="w-full text-xs">
            Contact Support
          </Button>
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-[#E5E7EB] space-y-2">
        <Button variant="ghost" className="w-full justify-start gap-3 text-[#6B7280] hover:text-[#111827]">
          <Settings className="w-4 h-4" />
          Settings
        </Button>
        <Button onClick={signOut} variant="ghost" className="w-full justify-start gap-3 text-[#DC2626] hover:text-[#DC2626] hover:bg-red-50">
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>;
};
export default ReceptionistSidebar;