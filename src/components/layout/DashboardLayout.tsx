import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import { MobileSidebar } from '@/components/ui/sidebar';
import { TopNavBar } from './TopNavBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarProvider } from '@/contexts/SidebarContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children
}) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // On mobile, hide global header for:
  // - Detail pages (cases, clients, contacts)
  // - Dashboard route (/) - uses MobileDashboardHeader instead
  const hideGlobalHeaderOnMobile = useMemo(() => {
    if (!isMobile) return false;
    // Hide on dashboard route
    if (location.pathname === '/') return true;
    // Hide on detail pages
    return /^\/(cases|clients|contacts)\/[^/]+/.test(location.pathname);
  }, [isMobile, location.pathname]);

  return (
    <SidebarProvider openSidebar={() => setSidebarOpen(true)}>
      <div className="flex h-screen w-screen flex-row bg-background overflow-x-hidden">
        {/* Mobile only: Collapsible sidebar */}
        <MobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex flex-1 flex-col w-full overflow-hidden">
          {!hideGlobalHeaderOnMobile && (
            <header className={`sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-[#E5E7EB] shadow-sm px-4 md:px-6 ${isMobile ? 'bg-white' : 'bg-slate-900'}`}>
              <div className="flex-1">
                <Header onMenuClick={() => setSidebarOpen(true)} />
              </div>
            </header>
          )}

          {/* Desktop only: Render top nav bar */}
          {!isMobile && <TopNavBar />}

          <main className="flex-1 overflow-auto bg-background pb-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
