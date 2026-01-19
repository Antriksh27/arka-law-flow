import React, { useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const threshold = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop === 0 && !isRefreshing) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0) {
        setIsPulling(true);
        setPullDistance(Math.min(diff, threshold * 1.5));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setIsPulling(false);
      setPullDistance(0);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    } else {
      setIsPulling(false);
      setPullDistance(0);
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 flex items-center justify-center transition-all',
          isPulling || isRefreshing ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          height: isRefreshing ? '60px' : `${pullDistance}px`,
        }}
      >
        <RefreshCw
          className={cn(
            'w-5 h-5 text-primary transition-transform',
            isRefreshing && 'animate-spin'
          )}
          style={{
            transform: `rotate(${pullDistance * 2}deg)`,
          }}
        />
      </div>

      {/* Content */}
      <div
        style={{
          transform: isPulling
            ? `translateY(${pullDistance}px)`
            : isRefreshing
            ? 'translateY(60px)'
            : 'translateY(0)',
          transition: isPulling ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};
