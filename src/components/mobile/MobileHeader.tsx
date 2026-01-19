import React from 'react';
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
  className,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
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
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-[var(--z-header)] w-full bg-background border-b border-border h-14 sm:hidden',
        'supports-[padding-top:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]',
        className
      )}
    >
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showBack && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-shrink-0 p-2 -ml-2 rounded-xl active:scale-95 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-muted z-10 relative"
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
