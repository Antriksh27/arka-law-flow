import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PremiumEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const PremiumEmptyState: React.FC<PremiumEmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className
}) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-6 text-center bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300 animate-in fade-in zoom-in duration-500",
      className
    )}>
      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6 relative">
        <div className="absolute inset-0 rounded-full bg-slate-200 animate-ping opacity-20" />
        <Icon className="w-10 h-10 text-slate-400 relative z-10" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-[280px] mb-8 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="rounded-2xl h-12 px-8 bg-slate-800 hover:bg-slate-700 shadow-lg hover:shadow-xl transition-all active:scale-95 text-base font-medium"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
