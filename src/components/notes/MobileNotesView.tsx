import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MobileNoteCard } from './MobileNoteCard';
import { NoteViewDialog } from './NoteViewDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { StickyNote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MobileNotesViewProps {
  searchQuery: string;
  selectedColor: string;
  selectedVisibility: string;
  selectedCase: string;
  onEditNote: (note: any) => void;
}

export const MobileNotesView: React.FC<MobileNotesViewProps> = ({
  searchQuery,
  selectedColor,
  selectedVisibility,
  selectedCase,
  onEditNote,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [viewingNote, setViewingNote] = useState<any>(null);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', searchQuery, selectedColor, selectedVisibility, selectedCase],
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
      return data || [];
    }
  });

  const hasActiveFilters = searchQuery || 
    (selectedColor && selectedColor !== 'all-colors') || 
    (selectedVisibility && selectedVisibility !== 'all-visibility') || 
    (selectedCase && selectedCase !== 'all-cases');

  // Skeleton Loader
  if (isLoading) {
    return (
      <div className="px-4 py-3 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border p-4 space-y-3 bg-card">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex justify-between pt-2 border-t border-border/50">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty State
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <StickyNote className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">
          {hasActiveFilters ? 'No notes found' : 'No notes yet'}
        </h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          {hasActiveFilters 
            ? 'Try adjusting your search or filters'
            : 'Tap the + button to create your first note'
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
      <div className="px-4 py-3 space-y-3 pb-24">
        {/* Pinned Notes Section */}
        {pinnedNotes.length > 0 && (
          <>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Pinned
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
            {pinnedNotes.map((note) => (
              <MobileNoteCard
                key={note.id}
                note={note}
                onClick={() => setViewingNote(note)}
              />
            ))}
          </>
        )}

        {/* Other Notes Section */}
        {unpinnedNotes.length > 0 && (
          <>
            {pinnedNotes.length > 0 && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Others
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}
            {unpinnedNotes.map((note) => (
              <MobileNoteCard
                key={note.id}
                note={note}
                onClick={() => setViewingNote(note)}
              />
            ))}
          </>
        )}
      </div>

      <NoteViewDialog
        note={viewingNote}
        open={!!viewingNote}
        onClose={() => setViewingNote(null)}
      />
    </>
  );
};
