
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NoteCard } from './NoteCard';
import { StickyNote, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotesGridProps {
  searchQuery: string;
  selectedTags: string[];
  selectedColor: string;
  selectedVisibility: string;
  selectedCase: string;
  onEditNote: (note: any) => void;
}

export const NotesGrid: React.FC<NotesGridProps> = ({
  searchQuery,
  selectedTags,
  selectedColor,
  selectedVisibility,
  selectedCase,
  onEditNote,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', searchQuery, selectedTags, selectedColor, selectedVisibility, selectedCase],
    queryFn: async () => {
      let query = supabase
        .from('notes_v2')
        .select(`
          *,
          profiles!notes_v2_created_by_fkey(full_name),
          cases(title)
        `)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      // Apply filters
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      // Handle color filter - ignore "all-colors" value
      if (selectedColor && selectedColor !== 'all-colors') {
        query = query.eq('color', selectedColor);
      }

      // Handle visibility filter - ignore "all-visibility" value
      if (selectedVisibility && selectedVisibility !== 'all-visibility') {
        query = query.eq('visibility', selectedVisibility);
      }

      // Handle case filter - ignore "all-cases" value
      if (selectedCase && selectedCase !== 'all-cases') {
        query = query.eq('case_id', selectedCase);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by tags if selected
      let filteredData = data || [];
      if (selectedTags.length > 0) {
        filteredData = filteredData.filter(note => 
          note.tags && selectedTags.every(tag => note.tags.includes(tag))
        );
      }

      return filteredData;
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('notes_v2')
        .delete()
        .eq('id', noteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({ title: "Note deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete note", variant: "destructive" });
    }
  });

  const togglePinMutation = useMutation({
    mutationFn: async ({ noteId, isPinned }: { noteId: string, isPinned: boolean }) => {
      const { error } = await supabase
        .from('notes_v2')
        .update({ is_pinned: isPinned })
        .eq('id', noteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: () => {
      toast({ title: "Failed to update note", variant: "destructive" });
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-gray-500">Loading notes...</div>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <StickyNote className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {searchQuery || selectedTags.length > 0 || (selectedColor && selectedColor !== 'all-colors') || (selectedVisibility && selectedVisibility !== 'all-visibility') || (selectedCase && selectedCase !== 'all-cases')
            ? 'No notes found'
            : 'No notes yet'
          }
        </h3>
        <p className="text-gray-500 mb-4">
          {searchQuery || selectedTags.length > 0 || (selectedColor && selectedColor !== 'all-colors') || (selectedVisibility && selectedVisibility !== 'all-visibility') || (selectedCase && selectedCase !== 'all-cases')
            ? 'Try adjusting your search or filters'
            : 'Start by creating your first note'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onEdit={() => onEditNote(note)}
          onDelete={() => deleteNoteMutation.mutate(note.id)}
          onTogglePin={(isPinned) => togglePinMutation.mutate({ noteId: note.id, isPinned })}
        />
      ))}
    </div>
  );
};
