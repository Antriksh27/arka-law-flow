import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface NotesTabProps {
  caseId: string;
}

export const NotesTab: React.FC<NotesTabProps> = ({ caseId }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
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

  const createNote = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notes_v2')
        .insert({
          case_id: caseId,
          title,
          content,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-notes', caseId] });
      setTitle('');
      setContent('');
      toast.success('Note created successfully');
    },
    onError: () => {
      toast.error('Failed to create note');
    }
  });

  const deleteNote = useMutation({
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    createNote.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Create Note Form */}
      <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-muted/30 rounded-lg">
        <h3 className="text-lg font-semibold">Add New Note</h3>
        <Input
          placeholder="Note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          placeholder="Note content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
        />
        <Button type="submit" disabled={createNote.isPending}>
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </form>

      {/* Notes List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading notes...</p>
          </div>
        ) : notes && notes.length > 0 ? (
          notes.map((note: any) => (
            <div key={note.id} className="p-4 border border-border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold">{note.title}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteNote.mutate(note.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{note.content}</p>
              <div className="text-xs text-muted-foreground">
                {note.profiles?.full_name} • {format(new Date(note.created_at), 'dd/MM/yyyy HH:mm')}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No notes yet. Add your first note above.</p>
          </div>
        )}
      </div>
    </div>
  );
};
