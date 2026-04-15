import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Scale, ListTodo, Users, Bell, Calendar } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';

export const MobileBottomNav: React.FC = () => {
  const { unreadCount } = useNotifications();
  const { trigger: haptic } = useHapticFeedback();

  const navItems = [
    {
      label: 'Home',
      icon: LayoutDashboard,
      to: '/',
    },
    {
      label: 'Cases',
      icon: Scale,
      to: '/cases',
    },
    {
      label: 'Tasks',
      icon: ListTodo,
      to: '/tasks',
    },
    {
      label: 'Appts',
      icon: Calendar,
      to: '/appointments',
    },
    {
      label: 'Inbox',
      icon: Bell,
      to: '/notifications',
      badge: unreadCount,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-background border-t border-border pb-safe pt-2 sm:hidden shadow-[0_-8px_30px_rgb(0,0,0,0.1)]">
      <div className="flex items-center justify-around px-2 h-14 bg-background">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => haptic('light')}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all relative',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-background">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
