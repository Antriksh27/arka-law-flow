import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SwipeAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: 'primary' | 'destructive' | 'warning' | 'success';
}

interface SwipeableCardProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  className?: string;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  className,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    setOffsetX(diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const threshold = 80;

    if (offsetX > threshold && leftActions.length > 0) {
      leftActions[0].onClick();
    } else if (offsetX < -threshold && rightActions.length > 0) {
      rightActions[0].onClick();
    }

    setOffsetX(0);
  };

  const getActionColor = (color: SwipeAction['color']) => {
    switch (color) {
      case 'primary':
        return 'bg-primary text-primary-foreground';
      case 'destructive':
        return 'bg-destructive text-white';
      case 'warning':
        return 'bg-warning text-white';
      case 'success':
        return 'bg-success text-white';
      default:
        return 'bg-muted text-foreground';
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Left actions */}
      {leftActions.length > 0 && offsetX > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex items-center gap-2 px-4">
          {leftActions.map((action, index) => (
            <div
              key={index}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg',
                getActionColor(action.color)
              )}
            >
              {action.icon}
              <span className="text-xs font-medium">{action.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Right actions */}
      {rightActions.length > 0 && offsetX < 0 && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 px-4">
          {rightActions.map((action, index) => (
            <div
              key={index}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg',
                getActionColor(action.color)
              )}
            >
              {action.icon}
              <span className="text-xs font-medium">{action.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Card content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        className={cn('bg-white', className)}
      >
        {children}
      </div>
    </div>
  );
};
