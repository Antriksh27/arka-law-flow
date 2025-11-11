import React from 'react';
import Header from './Header';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-[#F9FAFB]">
        <AppSidebar />
        <div className="flex-1 flex flex-col w-full overflow-hidden">
          <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-[#E5E7EB] bg-white shadow-sm px-4 md:px-6">
            <SidebarTrigger className="-ml-1 hover:bg-[#F9FAFB] rounded-md p-2 transition-colors" />
            <div className="flex-1">
              <Header />
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-[#F9FAFB]">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
