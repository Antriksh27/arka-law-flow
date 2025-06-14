
import React from 'react';

interface DefaultPageLayoutProps {
  children: React.ReactNode;
}

const DefaultPageLayout: React.FC<DefaultPageLayoutProps> = ({ children }) => {
  return <div className="h-screen w-screen bg-gray-50">{children}</div>;
};

export default DefaultPageLayout;
