import React from 'react';
import Header from './Header';
import { SessionNavBar } from '@/components/ui/sidebar';
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
    <div className="flex h-screen w-screen flex-row bg-[#F9FAFB]">
      {/* Desktop only: Collapsible sidebar */}
      <SessionNavBar />
      
      <div className="flex flex-1 flex-col w-full overflow-hidden">
        <header className={`sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-[#E5E7EB] shadow-sm px-4 md:px-6 ${isMobile ? 'bg-white' : 'bg-slate-900'}`}>
          <div className="flex-1">
            <Header />
          </div>
        </header>
        
        {/* Desktop only: Render top nav bar */}
        {!isMobile && <TopNavBar />}
        
        <main className="flex-1 overflow-auto bg-[#F9FAFB]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;