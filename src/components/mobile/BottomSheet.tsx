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
          "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity sm:hidden",
          isClosing ? "animate-fade-out" : "animate-fade-in"
        )}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-slate-50 rounded-t-3xl shadow-2xl sm:hidden flex flex-col",
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
        <div className="flex justify-center py-3 flex-shrink-0">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 pb-4 flex-shrink-0">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center active:scale-95 transition-all"
            >
              <X className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-safe">
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
