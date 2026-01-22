import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ReceptionistSidebar from './ReceptionistSidebar';
import { ReceptionistMobileSidebar } from './ReceptionistMobileSidebar';
import Header from './Header';
import { useIsMobile } from '@/hooks/use-mobile';

interface ReceptionistLayoutProps {
  children: React.ReactNode;
}

const ReceptionistLayout = ({ children }: ReceptionistLayoutProps) => {
  const { user, role, loading } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
          <div className="text-[#6B7280] text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (role !== 'receptionist') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      {/* Mobile Sidebar */}
      <ReceptionistMobileSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Header */}
      <header className={`sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-[#E5E7EB] shadow-sm px-4 md:px-6 ${isMobile ? 'bg-white' : 'bg-slate-900'}`}>
        <div className="flex-1">
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
      </header>
      
      <div className="flex flex-1">
        {/* Desktop Sidebar - hidden on mobile */}
        {!isMobile && <ReceptionistSidebar />}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ReceptionistLayout;