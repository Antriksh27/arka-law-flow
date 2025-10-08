import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, StickyNote, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CreateNoteMultiModal } from '@/components/notes/CreateNoteMultiModal';
import { EditNoteDialog } from '@/components/notes/EditNoteDialog';

interface NotesTabProps {
  caseId: string;
}

export const NotesTab: React.FC<NotesTabProps> = ({ caseId }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery({
    queryKey: ['case-notes', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes_v2')
        .select('*, profiles:created_by(full_name)')
        .eq('case_id', caseId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('notes_v2')
        .delete()
        .eq('id', noteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-notes', caseId] });
      toast.success('Note deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete note');
    }
  });

  if (isLoading) {
    return <div className="text-center py-8 text-[#6B7280]">Loading notes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[#111827]">Case Notes</h3>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>

      {notes && notes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-5 h-5 text-[#1E3A8A]" />
                  <h4 className="font-semibold text-[#111827]">{note.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingNote(note)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(note.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-[#6B7280] mb-3 line-clamp-3">{note.content}</p>
              <div className="flex items-center justify-between text-xs text-[#6B7280]">
                <span>{note.profiles?.full_name || 'Unknown'}</span>
                <span>{format(new Date(note.updated_at), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-[#E5E7EB]">
          <StickyNote className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
          <p className="text-[#6B7280] mb-4">No notes yet</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Note
          </Button>
        </div>
      )}

      <CreateNoteMultiModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
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
