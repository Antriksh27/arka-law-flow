import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: ('half' | 'full')[];
  defaultSnap?: 'half' | 'full';
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  children,
  title,
  snapPoints = ['full'],
  defaultSnap = 'full',
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [snap, setSnap] = useState<'half' | 'full'>(defaultSnap);

  useEffect(() => {
    if (open) {
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  if (!open && !isClosing) return null;

  const heightClass = snap === 'half' ? 'h-[50vh]' : 'h-[90vh]';

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 transition-opacity sm:hidden",
          isClosing ? "animate-fade-out" : "animate-fade-in"
        )}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl sm:hidden",
          heightClass,
          isClosing ? "animate-slide-out-bottom" : "animate-slide-in-bottom"
        )}
        style={{
          animation: isClosing
            ? 'slideOutBottom 0.2s ease-out forwards'
            : 'slideInBottom 0.2s ease-out forwards',
        }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-muted rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-muted active:scale-95 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto h-full pb-safe px-4 pt-4">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes slideInBottom {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        @keyframes slideOutBottom {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(100%);
          }
        }
      `}</style>
    </>
  );
};
