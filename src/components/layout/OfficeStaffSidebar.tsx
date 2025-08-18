import React from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, FileText, CheckSquare, MessageSquareText, Upload, Plus, LogOut, Settings, Receipt } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
const menuItems = [{
  name: 'Dashboard',
  href: '/staff/dashboard',
  icon: LayoutDashboard
}, {
  name: 'Cases Overview',
  href: '/staff/cases',
  icon: FolderOpen
}, {
  name: 'Documents',
  href: '/staff/documents',
  icon: FileText
}, {
  name: 'Tasks',
  href: '/staff/tasks',
  icon: CheckSquare
}, {
  name: 'Instructions',
  href: '/staff/instructions',
  icon: MessageSquareText
}, {
  name: 'Invoices',
  href: '/staff/invoices',
  icon: Receipt
}];
const quickActions = [{
  name: 'Upload Document',
  href: '/staff/documents?action=upload',
  icon: Upload
}, {
  name: 'New Task',
  href: '/staff/tasks?action=create',
  icon: Plus
}];
const OfficeStaffSidebar = () => {
  const location = useLocation();
  const {
    signOut
  } = useAuth();
  const isActive = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    signOut();
  };
  return <div className="w-64 bg-card border-r border-border h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">A</span>
          </div>
          <div>
            
            <p className="text-sm text-muted-foreground">Office Staff Portal</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <div className="space-y-1">
          {menuItems.map(item => {
          const Icon = item.icon;
          return <NavLink key={item.name} to={item.href} className={`nav-item ${isActive(item.href) ? 'active' : ''}`}>
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>;
        })}
        </div>

        {/* Quick Actions */}
        <div className="pt-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="space-y-1">
            {quickActions.map(action => {
            const Icon = action.icon;
            return <NavLink key={action.name} to={action.href} className="nav-item">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{action.name}</span>
                </NavLink>;
          })}
          </div>
        </div>

        {/* Help Section */}
        <div className="pt-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground mb-2">Need Help?</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Contact your lawyer or admin for assistance with case management.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Contact Support
            </Button>
          </div>
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start text-destructive hover:text-destructive" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>;
};
export default OfficeStaffSidebar;