import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import { MobileSidebar } from '@/components/ui/sidebar';
import { TopNavBar } from './TopNavBar';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children
}) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // On mobile detail pages we use the page-level MobileHeader (with back button)
  // instead of the global dashboard header.
  const hideGlobalHeaderOnMobile = useMemo(() => {
    if (!isMobile) return false;
    return /^\/(cases|clients|contacts)\/[^/]+/.test(location.pathname);
  }, [isMobile, location.pathname]);

  return (
    <div className="flex h-screen w-screen flex-row bg-background overflow-x-hidden">
      {/* Mobile only: Collapsible sidebar */}
      <MobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col w-full overflow-hidden">
        {!hideGlobalHeaderOnMobile && (
          <header className={`sticky top-0 z-[var(--z-header)] flex h-16 items-center gap-4 border-b border-[#E5E7EB] shadow-sm px-4 md:px-6 ${isMobile ? 'bg-white' : 'bg-slate-900'}`}>
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
  );
};

export default DashboardLayout;
