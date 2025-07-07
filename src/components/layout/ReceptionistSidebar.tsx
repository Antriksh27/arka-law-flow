import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  UserPlus,
  Home,
  Clock
} from 'lucide-react';

const receptionistNavigation = [
  { name: 'Reception Home', href: '/reception/home', icon: Home },
  { name: 'Appointments', href: '/reception/appointments', icon: Calendar },
  { name: 'Contacts', href: '/reception/contacts', icon: Users },
  { name: 'Today\'s Schedule', href: '/reception/schedule', icon: Clock },
];

const ReceptionistSidebar = () => {
  const location = useLocation();

  return (
    <div className="w-64 bg-white border-r border-[#E5E7EB] h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="text-xl font-bold text-[#111827]">Arka</span>
        </div>
        <p className="text-sm text-[#6B7280] mt-1">Reception Desk</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {receptionistNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-[#E0E7FF] text-[#1E3A8A] border border-[#1E3A8A]/20' 
                  : 'text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-[#E5E7EB]">
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F9FAFB] cursor-pointer">
          <div className="w-8 h-8 bg-[#1E3A8A] rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">R</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#111827] truncate">Receptionist</p>
            <p className="text-xs text-[#6B7280] truncate">Reception Desk</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistSidebar;