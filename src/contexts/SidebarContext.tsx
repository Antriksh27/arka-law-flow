import React, { createContext, useContext } from 'react';

interface SidebarContextType {
  openSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider: React.FC<{
  children: React.ReactNode;
  openSidebar: () => void;
}> = ({ children, openSidebar }) => {
  return (
    <SidebarContext.Provider value={{ openSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};
