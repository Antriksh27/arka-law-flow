import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import OfficeStaffSidebar from './OfficeStaffSidebar';
import OfficeStaffHeader from './OfficeStaffHeader';

interface OfficeStaffLayoutProps {
  children: React.ReactNode;
}

const OfficeStaffLayout = ({ children }: OfficeStaffLayoutProps) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (role !== 'office_staff') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OfficeStaffHeader />
      <div className="flex flex-1">
        <OfficeStaffSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default OfficeStaffLayout;