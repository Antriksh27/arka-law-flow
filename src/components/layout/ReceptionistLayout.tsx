import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ReceptionistSidebar from './ReceptionistSidebar';
import Header from './Header';

interface ReceptionistLayoutProps {
  children: React.ReactNode;
}

const ReceptionistLayout = ({ children }: ReceptionistLayoutProps) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#6B7280]">Loading...</div>
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
    <div className="min-h-screen bg-[#F9FAFB] flex">
      <ReceptionistSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ReceptionistLayout;