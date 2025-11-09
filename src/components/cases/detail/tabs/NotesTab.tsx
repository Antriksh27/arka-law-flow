import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { NoteCard } from '@/components/notes/NoteCard';
import { NoteViewDialog } from '@/components/notes/NoteViewDialog';
import { CreateNoteMultiModal } from '@/components/notes/CreateNoteMultiModal';
import { EditNoteDialog } from '@/components/notes/EditNoteDialog';
import { StickyNote, Plus } from 'lucide-react';

interface NotesTabProps {
  caseId: string;
}

export const NotesTab: React.FC<NotesTabProps> = ({ caseId }) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [viewingNote, setViewingNote] = useState<any>(null);

  const { data: notes, isLoading } = useQuery({
    queryKey: ['case-notes', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes_v2')
        .select(`
          *,
          profiles!notes_v2_created_by_fkey(full_name)
        `)
        .eq('case_id', caseId)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading notes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Notes</h3>
        <Button 
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>

      {notes && notes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={() => setEditingNote(note)}
              onDelete={() => {
                // Handle delete - this will be handled by the NoteCard component
              }}
              onTogglePin={() => {
                // Handle toggle pin - this will be handled by the NoteCard component
              }}
              onView={() => setViewingNote(note)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted">
          <StickyNote className="w-12 h-12 mx-auto mb-4 text-muted" />
          <p>No notes created yet</p>
          <Button 
            onClick={() => setShowCreateDialog(true)} 
            className="mt-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Note
          </Button>
        </div>
      )}

      <CreateNoteMultiModal
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        caseId={caseId}
      />

      {editingNote && (
        <EditNoteDialog
          note={editingNote}
          open={!!editingNote}
          onClose={() => setEditingNote(null)}
        />
      )}

      <NoteViewDialog
        note={viewingNote}
        open={!!viewingNote}
        onClose={() => setViewingNote(null)}
      />
    </div>
  );
};