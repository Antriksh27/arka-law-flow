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
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };
  return <header className={cn("sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 border-b border-border pt-safe h-14 sm:hidden", className)}>
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showBack && <button onClick={handleBack} className="flex-shrink-0 p-2 -ml-2 rounded-lg active:scale-95 transition-transform">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>}
          <h1 className="text-lg font-semibold text-foreground truncate">
            {title}
          </h1>
        </div>
        {actions}
      </div>
    </header>;
};