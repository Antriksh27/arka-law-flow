import React from 'react';
import Header from './Header';
import NavHeader from '../ui/nav-header';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  // Initialize real-time notifications
  useRealtimeNotifications();

  return (
    <div className="min-h-screen bg-legal-background">
      <Header />
      <div className="border-b border-gray-200 py-4">
        <NavHeader />
      </div>
      <main className="flex-1">
        <div>
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
