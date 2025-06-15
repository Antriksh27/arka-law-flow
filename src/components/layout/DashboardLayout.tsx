
import React from 'react';
import Header from './Header';
import NavHeader from '../ui/nav-header';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto">
          <NavHeader />
        </div>
      </div>
      <main className="flex-1">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
