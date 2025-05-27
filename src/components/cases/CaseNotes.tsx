
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { NoteCard } from '../notes/NoteCard';
import { CreateNoteDialog } from '../notes/CreateNoteDialog';
import { EditNoteDialog } from '../notes/EditNoteDialog';
import { StickyNote, Plus } from 'lucide-react';

interface CaseNotesProps {
  caseId: string;
}

export const CaseNotes: React.FC<CaseNotesProps> = ({ caseId }) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);

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
        <h3 className="text-xl font-semibold text-gray-900">Notes</h3>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-slate-800 hover:bg-slate-700 text-white"
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
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <StickyNote className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No notes created yet</p>
          <Button 
            className="mt-4 bg-slate-800 hover:bg-slate-700 text-white"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Note
          </Button>
        </div>
      )}

      <CreateNoteDialog
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
    </div>
  );
};
