import React from 'react';
import Header from '@/components/layout/Header';

interface DefaultPageLayoutProps {
  children: React.ReactNode;
}

const DefaultPageLayout: React.FC<DefaultPageLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-screen bg-gray-50">
      <Header />
      {children}
    </div>
  );
};

export default DefaultPageLayout;
