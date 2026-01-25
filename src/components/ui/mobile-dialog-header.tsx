import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
interface MobileDialogHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  className?: string;
  /** Optional icon to display next to the title */
  icon?: React.ReactNode;
  /** Whether to show a border at the bottom */
  showBorder?: boolean;
}
export const MobileDialogHeader: React.FC<MobileDialogHeaderProps> = ({
  title,
  subtitle,
  onClose,
  className,
  icon,
  showBorder = true
}) => {
  return <div className={cn("px-6 py-5 bg-background", showBorder && "border-b border-border", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              {icon}
            </div>}
          <div>
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
        </div>
        <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 bg-slate-200 hover:bg-slate-100" aria-label="Close dialog">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>;
};
export default MobileDialogHeader;