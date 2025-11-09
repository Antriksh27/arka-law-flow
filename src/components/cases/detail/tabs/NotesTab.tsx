import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { NoteCard } from '@/components/notes/NoteCard';
import { NoteViewDialog } from '@/components/notes/NoteViewDialog';
import { CreateNoteMultiModal } from '@/components/notes/CreateNoteMultiModal';
import { EditNoteDialog } from '@/components/notes/EditNoteDialog';
import { StickyNote, Plus, Shield, FileText, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { TimeUtils } from '@/lib/timeUtils';

interface NotesTabProps {
  caseId: string;
}

export const NotesTab: React.FC<NotesTabProps> = ({ caseId }) => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [viewingNote, setViewingNote] = useState<any>(null);
  const [newInternalNote, setNewInternalNote] = useState('');
  const [isAddingInternalNote, setIsAddingInternalNote] = useState(false);

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

  // Fetch internal notes
  const { data: internalNotes, isLoading: internalNotesLoading } = useQuery({
    queryKey: ['case-internal-notes', caseId],
    queryFn: async () => {
      const { data: notes, error } = await supabase
        .from('case_internal_notes')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching internal notes:', error);
        throw error;
      }

      // Fetch creator names from team_members
      if (notes && notes.length > 0) {
        const creatorIds = [...new Set(notes.map(n => n.created_by))];
        const { data: creators } = await supabase
          .from('team_members')
          .select('user_id, full_name')
          .in('user_id', creatorIds);

        const creatorMap = new Map(creators?.map(c => [c.user_id, c.full_name]) || []);
        
        return notes.map(note => ({
          ...note,
          creator: { full_name: creatorMap.get(note.created_by) || 'Unknown' }
        }));
      }
      
      return notes || [];
    },
    enabled: !!user
  });

  // Add internal note mutation
  const addInternalNoteMutation = useMutation({
    mutationFn: async (noteText: string) => {
      const { data, error } = await supabase
        .from('case_internal_notes')
        .insert({
          case_id: caseId,
          note: noteText.trim(),
          created_by: user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-internal-notes', caseId] });
      setNewInternalNote('');
      setIsAddingInternalNote(false);
      toast({ title: "Success", description: "Internal note added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add internal note", variant: "destructive" });
    }
  });

  // Delete internal note mutation
  const deleteInternalNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('case_internal_notes')
        .delete()
        .eq('id', noteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-internal-notes', caseId] });
      toast({ title: "Success", description: "Internal note deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete internal note", variant: "destructive" });
    }
  });

  const handleAddInternalNote = () => {
    if (!newInternalNote.trim()) {
      toast({ title: "Error", description: "Please enter a note", variant: "destructive" });
      return;
    }
    addInternalNoteMutation.mutate(newInternalNote);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading notes...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Internal Office Notes - Only visible to office_staff, admin, and lawyers */}
      {(role === 'office_staff' || role === 'admin' || role === 'lawyer' || (internalNotes && internalNotes.length > 0)) && (
        <Card className="bg-white rounded-2xl shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <CardTitle>Internal Office Notes</CardTitle>
                <Badge variant="outline" className="text-xs">Staff Only</Badge>
              </div>
              {!isAddingInternalNote && (role === 'office_staff' || role === 'admin' || role === 'lawyer') && (
                <Button size="sm" onClick={() => setIsAddingInternalNote(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Note
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAddingInternalNote && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <Textarea
                  placeholder="Enter internal note (visible only to office staff, admins, and lawyers)..."
                  value={newInternalNote}
                  onChange={(e) => setNewInternalNote(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsAddingInternalNote(false);
                      setNewInternalNote('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddInternalNote}
                    disabled={addInternalNoteMutation.isPending}
                  >
                    {addInternalNoteMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Note'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {internalNotesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : internalNotes && internalNotes.length > 0 ? (
              <div className="space-y-3">
                {internalNotes.map((note: any) => (
                  <div key={note.id} className="p-4 rounded-lg border border-border bg-slate-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {note.creator?.full_name || 'Unknown'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {TimeUtils.formatDate(note.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {note.note}
                        </p>
                      </div>
                      {(role === 'admin' || note.created_by === user?.id) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this note?')) {
                              deleteInternalNoteMutation.mutate(note.id);
                            }
                          }}
                          disabled={deleteInternalNoteMutation.isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm">No internal notes yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Regular Notes */}
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
      </div>

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