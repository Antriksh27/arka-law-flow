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
        "w-full h-full min-h-0 flex flex-col",
        className
      )}
    >
      {children}
    </div>
  );
};
