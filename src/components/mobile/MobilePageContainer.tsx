import React from 'react';
import { cn } from '@/lib/utils';

interface MobilePageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const MobilePageContainer: React.FC<MobilePageContainerProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "w-full min-h-[100dvh] pb-6",
        className
      )}
    >
      {children}
    </div>
  );
};
