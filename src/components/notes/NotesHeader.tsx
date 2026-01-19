
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileSearchBar } from '@/components/cases/MobileSearchBar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';

interface NotesHeaderProps {
  onCreateNote: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  selectedVisibility: string;
  onVisibilityChange: (visibility: string) => void;
  selectedCase: string;
  onCaseChange: (caseId: string) => void;
}

export const NotesHeader: React.FC<NotesHeaderProps> = ({
  onCreateNote,
  searchQuery,
  onSearchChange,
  selectedTags,
  onTagsChange,
  selectedColor,
  onColorChange,
  selectedVisibility,
  onVisibilityChange,
  selectedCase,
  onCaseChange,
}) => {
  const isMobile = useIsMobile();
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  
  // Fetch available tags
  const { data: availableTags = [] } = useQuery({
    queryKey: ['note-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes_v2')
        .select('tags')
        .not('tags', 'is', null);
      
      if (error) throw error;
      
      const allTags = new Set<string>();
      data.forEach(note => {
        if (note.tags) {
          note.tags.forEach((tag: string) => allTags.add(tag));
        }
      });
      
      return Array.from(allTags);
    }
  });

  // Fetch cases for filtering
  const { data: cases = [] } = useQuery({
    queryKey: ['cases-for-notes'],
    queryFn: async () => {
      const { data, error} = await supabase
        .from('cases')
        .select('id, case_title')
        .eq('status', 'pending')
        .order('title');
      
      if (error) throw error;
      return data || [];
    }
  });

  const clearFilters = () => {
    onTagsChange([]);
    onColorChange('all-colors');
    onVisibilityChange('all-visibility');
    onCaseChange('all-cases');
  };

  const hasActiveFilters = selectedTags.length > 0 || 
    selectedColor !== 'all-colors' || 
    selectedVisibility !== 'all-visibility' || 
    selectedCase !== 'all-cases';

  const activeFiltersCount = 
    (selectedColor !== 'all-colors' ? 1 : 0) +
    (selectedVisibility !== 'all-visibility' ? 1 : 0) +
    (selectedCase !== 'all-cases' ? 1 : 0) +
    selectedTags.length;

  // Mobile Filter Sheet
  const MobileFilterSheet = () => (
    <Sheet open={showMobileFilter} onOpenChange={setShowMobileFilter}>
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
              onClick={clearFilters}
              variant="outline"
              className="w-full h-12 border-2"
            >
              <X className="w-4 h-4 mr-2" />
              Clear All Filters
            </Button>
          )}

          <Button
            onClick={() => setShowMobileFilter(false)}
            className="w-full h-12 bg-slate-800 hover:bg-slate-700"
          >
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className={isMobile ? "px-4 py-3 space-y-4 border-b border-border" : "space-y-4"}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={isMobile ? "text-xl font-semibold text-gray-900" : "text-2xl font-semibold text-gray-900"}>
            Notes
          </h1>
          {!isMobile && <p className="text-sm text-gray-600 mt-1">Create and organize your notes</p>}
        </div>
        
        {!isMobile && (
          <Button 
            onClick={onCreateNote}
            className="bg-slate-800 hover:bg-slate-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        )}
      </div>

      {/* Mobile Search & Filter */}
      {isMobile ? (
        <MobileSearchBar
          value={searchQuery}
          onChange={onSearchChange}
          onFilterClick={() => setShowMobileFilter(true)}
          activeFiltersCount={activeFiltersCount}
        />
      ) : (
        /* Desktop Filters */
        <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search notes by title or content..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select value={selectedColor} onValueChange={onColorChange}>
            <SelectTrigger className="w-32 bg-white border-gray-300">
              <SelectValue placeholder="Color" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg">
              <SelectItem value="all-colors">All Colors</SelectItem>
              <SelectItem value="yellow">Yellow</SelectItem>
              <SelectItem value="blue">Blue</SelectItem>
              <SelectItem value="green">Green</SelectItem>
              <SelectItem value="red">Red</SelectItem>
              <SelectItem value="gray">Gray</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedVisibility} onValueChange={onVisibilityChange}>
            <SelectTrigger className="w-32 bg-white border-gray-300">
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg">
              <SelectItem value="all-visibility">All</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="team">Team</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCase} onValueChange={onCaseChange}>
            <SelectTrigger className="w-40 bg-white border-gray-300">
              <SelectValue placeholder="Linked Case" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60">
              <SelectItem value="all-cases">All Cases</SelectItem>
              {cases.map(caseItem => (
                <SelectItem key={caseItem.id} value={caseItem.id}>
                  {caseItem.case_title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="border-gray-300 bg-white hover:bg-gray-50"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>
      )}

      {/* Mobile Filter Sheet */}
      <MobileFilterSheet />

      {/* Selected Tags - shown on both mobile and desktop */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(tag => (
            <Badge
              key={tag}
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 cursor-pointer"
              onClick={() => onTagsChange(selectedTags.filter(t => t !== tag))}
            >
              {tag}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
