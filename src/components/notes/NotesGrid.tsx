import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NoteCard } from './NoteCard';
import { NoteViewDialog } from './NoteViewDialog';
import { Lightbulb, Pin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [viewingNote, setViewingNote] = useState<any>(null);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', searchQuery, selectedTags, selectedColor, selectedVisibility, selectedCase],
    queryFn: async () => {
      let query = supabase
        .from('notes_v2')
        .select(`
          *,
          profiles!notes_v2_created_by_fkey(full_name),
          cases(case_title)
        `)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      if (selectedColor && selectedColor !== 'all-colors') {
        query = query.eq('color', selectedColor);
      }

      if (selectedVisibility && selectedVisibility !== 'all-visibility') {
        query = query.eq('visibility', selectedVisibility);
      }

      if (selectedCase && selectedCase !== 'all-cases') {
        query = query.eq('case_id', selectedCase);
      }

      const { data, error } = await query;
      if (error) throw error;

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

  // Google Keep style skeleton loader - masonry layout
  if (isLoading) {
    return (
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
        {[120, 80, 150, 100, 130, 90, 110, 140].map((height, i) => (
          <div 
            key={i} 
            className="break-inside-avoid mb-4 rounded-xl border border-border bg-muted/30 p-4"
            style={{ minHeight: `${height}px` }}
          >
            <Skeleton className="h-5 w-3/4 mb-3" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-5/6 mb-2" />
            <Skeleton className="h-3 w-4/6" />
          </div>
        ))}
      </div>
    );
  }

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || 
    (selectedColor && selectedColor !== 'all-colors') || 
    (selectedVisibility && selectedVisibility !== 'all-visibility') || 
    (selectedCase && selectedCase !== 'all-cases');

  // Empty state - Google Keep style
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-32 h-32 mb-6 opacity-20">
          <Lightbulb className="w-full h-full text-muted-foreground" strokeWidth={1} />
        </div>
        <h3 className="text-xl font-medium text-foreground mb-2">
          {hasActiveFilters ? 'No matching notes' : 'Notes you add appear here'}
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          {hasActiveFilters
            ? 'Try different search terms or filters'
            : 'Click the + button to capture your thoughts, ideas, lists, and more'
          }
        </p>
      </div>
    );
  }

  // Separate pinned and unpinned notes
  const pinnedNotes = notes.filter(note => note.is_pinned);
  const unpinnedNotes = notes.filter(note => !note.is_pinned);

  return (
    <>
      {/* Pinned Notes Section */}
      {pinnedNotes.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Pin className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pinned
            </span>
          </div>
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={() => onEditNote(note)}
                onDelete={() => deleteNoteMutation.mutate(note.id)}
                onTogglePin={(isPinned) => togglePinMutation.mutate({ noteId: note.id, isPinned })}
                onView={() => setViewingNote(note)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Notes Section */}
      {unpinnedNotes.length > 0 && (
        <div>
          {pinnedNotes.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Others
              </span>
            </div>
          )}
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {unpinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={() => onEditNote(note)}
                onDelete={() => deleteNoteMutation.mutate(note.id)}
                onTogglePin={(isPinned) => togglePinMutation.mutate({ noteId: note.id, isPinned })}
                onView={() => setViewingNote(note)}
              />
            ))}
          </div>
        </div>
      )}

      <NoteViewDialog
        note={viewingNote}
        open={!!viewingNote}
        onClose={() => setViewingNote(null)}
        onEdit={() => {
          if (viewingNote) {
            onEditNote(viewingNote);
            setViewingNote(null);
          }
        }}
      />
    </>
  );
};
