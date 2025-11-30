import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MobileFABProps {
  onClick: () => void;
  icon: LucideIcon;
  label?: string;
  className?: string;
}

export const MobileFAB: React.FC<MobileFABProps> = ({
  onClick,
  icon: Icon,
  label,
  className,
}) => {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-20 right-4 z-40 h-14 rounded-full shadow-lg",
        "bg-slate-800 hover:bg-slate-700 text-white",
        "active:scale-95 transition-all",
        "sm:hidden",
        label ? "px-6" : "w-14 p-0",
        className
      )}
      aria-label={label || "Action button"}
    >
      <Icon className="w-6 h-6" />
      {label && <span className="ml-2 font-medium">{label}</span>}
    </Button>
  );
};
