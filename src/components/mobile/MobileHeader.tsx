import React, { useCallback, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  /** Route to navigate to when tapping back (preferred for detail pages) */
  backTo?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBack = false,
  onBack,
  backTo,
  actions,
  className
}) => {
  const navigate = useNavigate();
  const isNavigatingRef = useRef(false);

  const handleBack = useCallback(() => {
    // Prevent double-firing from touch + click events
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    // Reset after a short delay in case navigation fails
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 500);

    if (onBack) {
      onBack();
      return;
    }

    // If a back route is provided, use it (more predictable than history(-1)).
    if (backTo) {
      navigate(backTo);
      return;
    }

    // Otherwise try browser history.
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) {
      navigate(-1);
      return;
    }
    navigate('/');
  }, [onBack, backTo, navigate]);

  return (
    <header
      className={cn(
        // Use min-height + safe-area padding to avoid clipping on iOS / emulators
        'sticky top-0 z-40 w-full bg-background border-b border-border sm:hidden',
        'supports-[padding-top:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]',
        'min-h-[calc(3.5rem+env(safe-area-inset-top))]',
        className
      )}
    >
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showBack && (
            <button
              type="button"
              // Use Pointer events for consistent mobile behavior (avoids flaky click/touch combos)
              onPointerUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleBack();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleBack();
                }
              }}
              className="flex-shrink-0 p-2 -ml-2 rounded-xl active:scale-95 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center z-10 relative bg-slate-50 touch-manipulation cursor-pointer select-none"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-foreground pointer-events-none" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </header>
  );
};