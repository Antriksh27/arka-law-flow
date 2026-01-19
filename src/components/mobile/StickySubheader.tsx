import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface StickySubheaderProps {
  children: React.ReactNode;
  className?: string;
  /** Distance from top where this sticks (default: 56px = h-14 mobile header) */
  topOffset?: string;
}

/**
 * A sticky subheader component that adds subtle shadow + backdrop blur
 * when user scrolls, improving visual separation.
 */
export const StickySubheader: React.FC<StickySubheaderProps> = ({
  children,
  className,
  topOffset = '56px', // 14 * 4 = 56px (h-14)
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Trigger effect after scrolling past a small threshold
      setIsScrolled(window.scrollY > 8);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={cn(
        'sticky z-[var(--z-sticky)] bg-background/95 transition-all duration-200',
        'supports-[backdrop-filter]:bg-background/80',
        isScrolled && 'shadow-sm backdrop-blur-md',
        className
      )}
      style={{ top: topOffset }}
    >
      {children}
    </div>
  );
};
