
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  File, 
  Folder, 
  Inbox,
  MessageSquare,
  ClipboardList,
  Clock,
  FileCode,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ReceptionistSidebar from './ReceptionistSidebar';

const getNavigationForRole = (role: string | null) => {
  const baseNavigation = [
    { name: 'Dashboard', href: '/', icon: Inbox },
    { name: 'Cases', href: '/cases', icon: Folder },
    { name: 'eCourts', href: '/ecourts', icon: FileCode },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Appointments', href: '/appointments', icon: Calendar },
    { name: 'Availability', href: '/availability', icon: Clock },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Hearings', href: '/hearings', icon: Calendar },
    { name: 'Tasks', href: '/tasks', icon: File },
    { name: 'Instructions', href: '/instructions', icon: ClipboardList },
    { name: 'Notes', href: '/notes', icon: File },
    { name: 'Documents', href: '/documents', icon: Folder },
  ];

  // Add role-specific navigation items
  if (role && !['junior'].includes(role)) {
    baseNavigation.push({ name: 'Invoices', href: '/invoices', icon: File });
  }

  if (role && ['admin', 'lawyer'].includes(role)) {
    baseNavigation.push({ name: 'Team', href: '/team', icon: Users });
    baseNavigation.push({ name: 'Notifications', href: '/notifications/monitoring', icon: Activity });
  }

  return baseNavigation;
};

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Get user role from team_members table
  const [userRole, setUserRole] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setUserRole(data.role);
      }
    };
    
    fetchUserRole();
  }, [user?.id]);
  
  // Show receptionist sidebar for receptionists
  if (userRole === 'receptionist') {
    return <ReceptionistSidebar />;
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Arka</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">Legal CRM Platform</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {getNavigationForRole(userRole).map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">User</p>
            <p className="text-xs text-gray-500 truncate">Lawyer</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
