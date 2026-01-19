import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBack = false,
  onBack,
  actions,
  className
}) => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    console.log('[MobileHeader] Back button clicked, onBack:', !!onBack);
    if (onBack) {
      onBack();
    } else {
      console.log('[MobileHeader] Navigating back with navigate(-1)');
      navigate(-1);
    }
  };
  
  return (
    <header className={cn(
      "sticky top-0 z-30 w-full backdrop-blur-md bg-background/95 border-b border-border h-14 sm:hidden",
      "supports-[padding-top:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]",
      className
    )}>
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
          <h1 className="text-lg font-semibold text-foreground truncate">
            {title}
          </h1>
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};