import React from 'react';
import { BottomSheet } from '@/components/mobile/BottomSheet';
import { Button } from '@/components/ui/button';
import { Check, X, Filter, Briefcase, Users, Scale, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CARD_STYLES } from '@/lib/mobileStyles';

interface MobileFiltersSheetProps {
  open: boolean;
  onClose: () => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  assignedFilter: string;
  onAssignedChange: (value: string) => void;
  onClearFilters: () => void;
}

export const MobileFiltersSheet: React.FC<MobileFiltersSheetProps> = ({
  open,
  onClose,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  assignedFilter,
  onAssignedChange,
  onClearFilters,
}) => {
  const activeFiltersCount = [
    statusFilter !== 'all',
    typeFilter !== 'all',
    assignedFilter !== 'all'
  ].filter(Boolean).length;

  const statusOptions = [
    { value: 'all', label: 'All', bg: 'bg-slate-100', activeBg: 'bg-slate-800', activeText: 'text-white' },
    { value: 'pending', label: 'Pending', bg: 'bg-amber-50', activeBg: 'bg-amber-500', activeText: 'text-white' },
    { value: 'disposed', label: 'Disposed', bg: 'bg-violet-50', activeBg: 'bg-violet-500', activeText: 'text-white' },
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types', icon: Briefcase, bg: 'bg-slate-100', iconColor: 'text-slate-500' },
    { value: 'civil', label: 'Civil', icon: Scale, bg: 'bg-sky-50', iconColor: 'text-sky-500' },
    { value: 'criminal', label: 'Criminal', icon: Scale, bg: 'bg-rose-50', iconColor: 'text-rose-500' },
    { value: 'corporate', label: 'Corporate', icon: Briefcase, bg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
    { value: 'family', label: 'Family', icon: Home, bg: 'bg-violet-50', iconColor: 'text-violet-500' },
  ];

  const assignedOptions = [
    { value: 'all', label: 'All Users', bg: 'bg-slate-100' },
    { value: 'me', label: 'Assigned to Me', bg: 'bg-emerald-50' },
    { value: 'unassigned', label: 'Unassigned', bg: 'bg-rose-50' },
  ];

  return (
    <BottomSheet open={open} onClose={onClose} title="Filter Cases">
      <div className="px-4 space-y-4 pb-24">
        {/* Status Filter Card */}
        <div className={CARD_STYLES.base}>
          <div className="p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Status</h3>
            <div className="flex gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onStatusChange(option.value)}
                  className={cn(
                    "flex-1 py-3 rounded-full font-medium text-sm transition-all active:scale-95",
                    statusFilter === option.value
                      ? `${option.activeBg} ${option.activeText}`
                      : `${option.bg} text-slate-700`
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Case Type Filter Card */}
        <div className={CARD_STYLES.base}>
          <div className="p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Case Type</h3>
            <div className="grid grid-cols-2 gap-2">
              {typeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = typeFilter === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => onTypeChange(option.value)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98] border",
                      isSelected
                        ? `${option.bg} border-transparent`
                        : "bg-white border-slate-200"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      isSelected ? option.bg : "bg-slate-100"
                    )}>
                      <Icon className={cn(
                        "w-5 h-5",
                        isSelected ? option.iconColor : "text-slate-400"
                      )} />
                    </div>
                    <span className={cn(
                      "flex-1 text-left text-sm font-medium",
                      isSelected ? "text-slate-900" : "text-slate-600"
                    )}>
                      {option.label}
                    </span>
                    {isSelected && (
                      <Check className={cn("w-4 h-4", option.iconColor)} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Assigned To Filter Card */}
        <div className={CARD_STYLES.base}>
          <div className="p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Assigned To</h3>
            <div className="space-y-2">
              {assignedOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onAssignedChange(option.value)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98]",
                    assignedFilter === option.value
                      ? option.bg
                      : "bg-slate-50 hover:bg-slate-100"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    assignedFilter === option.value ? option.bg : "bg-slate-200"
                  )}>
                    <Users className={cn(
                      "w-5 h-5",
                      assignedFilter === option.value 
                        ? option.value === 'me' ? "text-emerald-500" 
                          : option.value === 'unassigned' ? "text-rose-500" 
                          : "text-slate-500"
                        : "text-slate-400"
                    )} />
                  </div>
                  <span className={cn(
                    "flex-1 text-left font-medium",
                    assignedFilter === option.value ? "text-slate-900" : "text-slate-600"
                  )}>
                    {option.label}
                  </span>
                  {assignedFilter === option.value && (
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      option.value === 'me' ? "bg-emerald-500" 
                        : option.value === 'unassigned' ? "bg-rose-500" 
                        : "bg-slate-500"
                    )}>
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
        {activeFiltersCount > 0 && (
          <Button 
            variant="outline" 
            onClick={onClearFilters} 
            className="flex-1 h-12 rounded-full border-slate-200 text-slate-700"
          >
            <X className="w-4 h-4 mr-2" />
            Clear ({activeFiltersCount})
          </Button>
        )}
        <Button 
          onClick={onClose} 
          className={cn(
            "h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-white",
            activeFiltersCount > 0 ? "flex-1" : "w-full"
          )}
        >
          Apply Filters
        </Button>
      </div>
    </BottomSheet>
  );
};
