import React from 'react';
import { cn } from '@/lib/utils';

interface MobilePageContainerProps {
  children: React.ReactNode;
  className?: string;
  withBottomNav?: boolean;
}

export const MobilePageContainer: React.FC<MobilePageContainerProps> = ({
  children,
  className,
  withBottomNav = true,
}) => {
  return (
    <div 
      className={cn(
        "w-full min-h-screen overflow-x-hidden",
        withBottomNav ? "pb-24" : "pb-6",
        className
      )}
    >
      {children}
    </div>
  );
};
