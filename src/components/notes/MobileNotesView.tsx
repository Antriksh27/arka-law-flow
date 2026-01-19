import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MobileNoteCard } from './MobileNoteCard';
import { NoteViewDialog } from './NoteViewDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { StickyNote, Lightbulb } from 'lucide-react';

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

  // Google Keep style skeleton loader
  if (isLoading) {
    return (
      <div className="px-3 py-4">
        <div className="columns-2 gap-3">
          {[40, 60, 50, 70, 45, 55].map((height, i) => (
            <div 
              key={i} 
              className="break-inside-avoid mb-3 rounded-xl border border-border bg-muted/30 p-3"
              style={{ minHeight: `${height * 2}px` }}
            >
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-5/6 mb-1" />
              <Skeleton className="h-3 w-4/6" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty State - Google Keep style
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <div className="w-24 h-24 mb-6 opacity-30">
          <Lightbulb className="w-full h-full text-muted-foreground" strokeWidth={1} />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          {hasActiveFilters ? 'No matching notes' : 'Notes you add appear here'}
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          {hasActiveFilters 
            ? 'Try different search terms or filters'
            : 'Tap the + button to capture thoughts, ideas, and more'
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
      <div className="px-3 py-4 pb-24">
        {/* Pinned Notes Section */}
        {pinnedNotes.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Pinned
              </span>
            </div>
            <div className="columns-2 gap-3">
              {pinnedNotes.map((note) => (
                <MobileNoteCard
                  key={note.id}
                  note={note}
                  onClick={() => setViewingNote(note)}
                />
              ))}
            </div>
          </>
        )}

        {/* Other Notes Section */}
        {unpinnedNotes.length > 0 && (
          <>
            {pinnedNotes.length > 0 && (
              <div className="flex items-center gap-2 mb-3 mt-4">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Others
                </span>
              </div>
            )}
            <div className="columns-2 gap-3">
              {unpinnedNotes.map((note) => (
                <MobileNoteCard
                  key={note.id}
                  note={note}
                  onClick={() => setViewingNote(note)}
                />
              ))}
            </div>
          </>
        )}
      </div>

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
