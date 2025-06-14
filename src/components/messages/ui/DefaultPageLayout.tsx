
import React from 'react';

interface DefaultPageLayoutProps {
  children: React.ReactNode;
}

const DefaultPageLayout: React.FC<DefaultPageLayoutProps> = ({ children }) => {
  return <div className="h-screen w-screen bg-legal-background">{children}</div>;
};

export default DefaultPageLayout;
