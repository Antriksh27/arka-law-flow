import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { StickyNote, Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface NotesTabProps {
  caseId: string;
}

export const NotesTab: React.FC<NotesTabProps> = ({ caseId }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery({
    queryKey: ['case-notes', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes_v2')
        .select('*, profiles(full_name)')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const createNoteMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('notes_v2').insert({
        title: noteTitle,
        content: noteContent,
        case_id: caseId,
        created_by: user.id
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-notes', caseId] });
      setNoteTitle('');
      setNoteContent('');
      setIsAdding(false);
      toast.success('Note added successfully');
    },
    onError: () => {
      toast.error('Failed to add note');
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from('notes_v2').delete().eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-notes', caseId] });
      toast.success('Note deleted');
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Case Notes</h3>
        <Button onClick={() => setIsAdding(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>

      {isAdding && (
        <Card className="p-4 border-2 border-blue-200">
          <Input
            placeholder="Note title..."
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            className="mb-3"
          />
          <Textarea
            placeholder="Write your note here..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={4}
            className="mb-3"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => createNoteMutation.mutate()}
              disabled={!noteTitle || !noteContent}
              size="sm"
            >
              Save Note
            </Button>
            <Button
              onClick={() => {
                setIsAdding(false);
                setNoteTitle('');
                setNoteContent('');
              }}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {notes && notes.length > 0 ? (
        <div className="grid gap-4">
          {notes.map((note: any) => (
            <Card key={note.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <StickyNote className="w-5 h-5 text-yellow-500 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{note.title}</h4>
                    <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{note.profiles?.full_name || 'Unknown'}</span>
                      <span>•</span>
                      <span>{format(new Date(note.created_at), 'dd MMM yyyy, hh:mm a')}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteNoteMutation.mutate(note.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        !isAdding && (
          <Card className="p-12 text-center">
            <StickyNote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No notes yet</p>
            <Button onClick={() => setIsAdding(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add First Note
            </Button>
          </Card>
        )
      )}
    </div>
  );
};
