import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="py-6 space-y-6">
          {/* Color Filter */}
          <div>
            <h3 className="text-sm font-medium mb-3">Color</h3>
            <div className="flex flex-wrap gap-2">
              {['all-colors', 'yellow', 'blue', 'green', 'red', 'gray'].map((color) => (
                <button
                  key={color}
                  onClick={() => onColorChange(color)}
                  className={`px-4 h-10 rounded-full font-medium text-sm transition-all ${
                    selectedColor === color
                      ? 'bg-slate-800 text-white'
                      : 'bg-white border border-border text-foreground'
                  }`}
                >
                  {color === 'all-colors' ? 'All' : color.charAt(0).toUpperCase() + color.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility Filter */}
          <div>
            <h3 className="text-sm font-medium mb-3">Visibility</h3>
            <div className="flex flex-wrap gap-2">
              {['all-visibility', 'private', 'team'].map((visibility) => (
                <button
                  key={visibility}
                  onClick={() => onVisibilityChange(visibility)}
                  className={`px-4 h-10 rounded-full font-medium text-sm transition-all ${
                    selectedVisibility === visibility
                      ? 'bg-slate-800 text-white'
                      : 'bg-white border border-border text-foreground'
                  }`}
                >
                  {visibility === 'all-visibility' ? 'All' : visibility.charAt(0).toUpperCase() + visibility.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Case Filter */}
          <div>
            <h3 className="text-sm font-medium mb-3">Linked Case</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <button
                onClick={() => onCaseChange('all-cases')}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedCase === 'all-cases'
                    ? 'bg-slate-100'
                    : 'bg-white border border-border'
                }`}
              >
                All Cases
              </button>
              {cases.map((caseItem) => (
                <button
                  key={caseItem.id}
                  onClick={() => onCaseChange(caseItem.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all truncate ${
                    selectedCase === caseItem.id
                      ? 'bg-slate-100'
                      : 'bg-white border border-border'
                  }`}
                >
                  {caseItem.case_title}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <Button
              onClick={onClearFilters}
              variant="outline"
              className="w-full h-12 border-2"
            >
              <X className="w-4 h-4 mr-2" />
              Clear All Filters
            </Button>
          )}

          <Button
            onClick={onClose}
            className="w-full h-12 bg-slate-800 hover:bg-slate-700"
          >
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
