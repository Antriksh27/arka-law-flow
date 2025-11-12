import React from 'react';
import Header from './Header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { TopNavBar } from './TopNavBar';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children
}) => {
  const isMobile = useIsMobile();

  return (
    <>
      {/* Mobile: Use Sidebar with hamburger */}
      {isMobile ? (
        <SidebarProvider defaultOpen={false}>
          <div className="flex min-h-screen w-full bg-[#F9FAFB]">
            <AppSidebar />
            <div className="flex-1 flex flex-col w-full overflow-hidden">
              <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-[#E5E7EB] shadow-sm px-4 bg-white">
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
      ) : (
        /* Desktop: Use Top Navigation Bar */
        <div className="flex flex-col min-h-screen w-full bg-[#F9FAFB]">
          <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-[#E5E7EB] shadow-sm px-4 md:px-6 bg-slate-900">
            <div className="flex-1">
              <Header />
            </div>
          </header>
          <TopNavBar />
          <main className="flex-1 overflow-auto bg-[#F9FAFB]">
            {children}
          </main>
        </div>
      )}
    </>
  );
};

export default DashboardLayout;