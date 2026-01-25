import React from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X, Check, Briefcase, Eye, EyeOff, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { PASTEL_COLORS, NOTE_COLORS, CARD_STYLES } from '@/lib/mobileStyles';

interface NotesFilterSheetProps {
  open: boolean;
  onClose: () => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  selectedVisibility: string;
  onVisibilityChange: (visibility: string) => void;
  selectedCase: string;
  onCaseChange: (caseId: string) => void;
  onClearFilters: () => void;
}

export const NotesFilterSheet: React.FC<NotesFilterSheetProps> = ({
  open,
  onClose,
  selectedColor,
  onColorChange,
  selectedVisibility,
  onVisibilityChange,
  selectedCase,
  onCaseChange,
  onClearFilters,
}) => {
  // Fetch cases for filtering
  const { data: cases = [] } = useQuery({
    queryKey: ['cases-for-notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title')
        .eq('status', 'pending')
        .order('case_title');
      
      if (error) throw error;
      return data || [];
    }
  });

  const hasActiveFilters = 
    selectedColor !== 'all-colors' || 
    selectedVisibility !== 'all-visibility' || 
    selectedCase !== 'all-cases';

  const colorOptions = [
    { value: 'all-colors', label: 'All', color: 'bg-slate-100' },
    { value: 'yellow', label: 'Yellow', color: 'bg-amber-200' },
    { value: 'blue', label: 'Blue', color: 'bg-sky-200' },
    { value: 'green', label: 'Green', color: 'bg-emerald-200' },
    { value: 'red', label: 'Red', color: 'bg-rose-200' },
    { value: 'gray', label: 'Gray', color: 'bg-slate-300' },
  ];

  const visibilityOptions = [
    { value: 'all-visibility', label: 'All', icon: null, bg: 'bg-slate-100', iconColor: 'text-slate-500' },
    { value: 'private', label: 'Private', icon: EyeOff, bg: 'bg-violet-50', iconColor: 'text-violet-500' },
    { value: 'team', label: 'Team', icon: Users, bg: 'bg-sky-50', iconColor: 'text-sky-500' },
  ];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent hideCloseButton side="bottom" className="h-[85vh] rounded-t-3xl bg-slate-50 p-0 border-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center active:scale-95 transition-all"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto h-[calc(85vh-140px)]">
          {/* Color Filter Card */}
          <div className={CARD_STYLES.base}>
            <div className="p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Color</h3>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onColorChange(option.value)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all active:scale-95",
                      selectedColor === option.value
                        ? "bg-slate-800 text-white"
                        : "bg-white border border-slate-200 text-slate-700"
                    )}
                  >
                    <div className={cn("w-4 h-4 rounded-full", option.color)} />
                    {option.label}
                    {selectedColor === option.value && (
                      <Check className="w-3.5 h-3.5 ml-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visibility Filter Card */}
          <div className={CARD_STYLES.base}>
            <div className="p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Visibility</h3>
              <div className="flex gap-2">
                {visibilityOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => onVisibilityChange(option.value)}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-2 py-3 rounded-xl transition-all active:scale-95 border",
                        selectedVisibility === option.value
                          ? `${option.bg} border-transparent`
                          : "bg-white border-slate-200"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        selectedVisibility === option.value ? option.bg : "bg-slate-100"
                      )}>
                        {Icon ? (
                          <Icon className={cn("w-5 h-5", selectedVisibility === option.value ? option.iconColor : "text-slate-400")} />
                        ) : (
                          <Eye className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <span className={cn(
                        "text-sm font-medium",
                        selectedVisibility === option.value ? "text-slate-900" : "text-slate-600"
                      )}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Case Filter Card */}
          <div className={CARD_STYLES.base}>
            <div className="p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Linked Case</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <button
                  onClick={() => onCaseChange('all-cases')}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98]",
                    selectedCase === 'all-cases'
                      ? "bg-sky-50"
                      : "bg-slate-50 hover:bg-slate-100"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    selectedCase === 'all-cases' ? "bg-sky-100" : "bg-slate-200"
                  )}>
                    <Briefcase className={cn(
                      "w-5 h-5",
                      selectedCase === 'all-cases' ? "text-sky-500" : "text-slate-400"
                    )} />
                  </div>
                  <span className={cn(
                    "flex-1 text-left font-medium",
                    selectedCase === 'all-cases' ? "text-slate-900" : "text-slate-600"
                  )}>
                    All Cases
                  </span>
                  {selectedCase === 'all-cases' && (
                    <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </button>
                {cases.map((caseItem) => (
                  <button
                    key={caseItem.id}
                    onClick={() => onCaseChange(caseItem.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98]",
                      selectedCase === caseItem.id
                        ? "bg-sky-50"
                        : "bg-slate-50 hover:bg-slate-100"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      selectedCase === caseItem.id ? "bg-sky-100" : "bg-slate-200"
                    )}>
                      <Briefcase className={cn(
                        "w-5 h-5",
                        selectedCase === caseItem.id ? "text-sky-500" : "text-slate-400"
                      )} />
                    </div>
                    <span className={cn(
                      "flex-1 text-left font-medium truncate",
                      selectedCase === caseItem.id ? "text-slate-900" : "text-slate-600"
                    )}>
                      {caseItem.case_title}
                    </span>
                    {selectedCase === caseItem.id && (
                      <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-slate-100 flex gap-3">
          {hasActiveFilters && (
            <Button
              onClick={onClearFilters}
              variant="outline"
              className="flex-1 h-12 rounded-full border-slate-200 text-slate-700"
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
          <Button
            onClick={onClose}
            className={cn(
              "h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-white",
              hasActiveFilters ? "flex-1" : "w-full"
            )}
          >
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
