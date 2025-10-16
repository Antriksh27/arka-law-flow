
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title')
        .eq('status', 'open')
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notes</h1>
          <p className="text-sm text-gray-600 mt-1">Create and organize your notes</p>
        </div>
        
        <Button 
          onClick={onCreateNote}
          className="bg-slate-800 hover:bg-slate-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Note
        </Button>
      </div>

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

      {/* Selected Tags */}
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
