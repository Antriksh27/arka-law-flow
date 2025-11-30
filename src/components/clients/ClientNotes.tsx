import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pin, Eye, EyeOff, Shield, FileText, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { CreateNoteMultiModal } from '@/components/notes/CreateNoteMultiModal';
import { NoteViewDialog } from '@/components/notes/NoteViewDialog';
import { EditNoteDialog } from '@/components/notes/EditNoteDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { TimeUtils } from '@/lib/timeUtils';
import { useIsMobile } from '@/hooks/use-mobile';
interface ClientNotesProps {
  clientId: string;
}
export const ClientNotes: React.FC<ClientNotesProps> = ({
  clientId
}) => {
  const isMobile = useIsMobile();
  const {
    user,
    role
  } = useAuth();
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [newInternalNote, setNewInternalNote] = useState('');
  const [isAddingInternalNote, setIsAddingInternalNote] = useState(false);

  // Fetch both notes_v2 and client notes
  const {
    data: notesV2 = [],
    isLoading: notesV2Loading
  } = useQuery({
    queryKey: ['client-notes-v2', clientId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('notes_v2').select(`
          *,
          created_by:profiles!notes_v2_created_by_fkey(full_name)
        `).eq('client_id', clientId).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return data;
    }
  });
  const {
    data: clientData,
    isLoading: clientLoading
  } = useQuery({
    queryKey: ['client-data', clientId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('clients').select('notes, created_at, created_by').eq('id', clientId).single();
      if (error) {
        console.error('Error fetching client data:', error);
        throw error;
      }
      console.log('Client data:', data);
      return data;
    }
  });

  // Fetch internal notes
  const {
    data: internalNotes,
    isLoading: internalNotesLoading
  } = useQuery({
    queryKey: ['client-internal-notes', clientId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('client_internal_notes').select('*').eq('client_id', clientId).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching internal notes:', error);
        throw error;
      }
      return data;
    },
    enabled: !!user
  });

  // Add internal note mutation
  const addInternalNoteMutation = useMutation({
    mutationFn: async (noteText: string) => {
      const {
        data,
        error
      } = await supabase.from('client_internal_notes').insert({
        client_id: clientId,
        note: noteText.trim(),
        created_by: user?.id
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['client-internal-notes', clientId]
      });
      setNewInternalNote('');
      setIsAddingInternalNote(false);
      toast({
        title: "Success",
        description: "Internal note added successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add internal note",
        variant: "destructive"
      });
    }
  });

  // Delete internal note mutation
  const deleteInternalNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const {
        error
      } = await supabase.from('client_internal_notes').delete().eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['client-internal-notes', clientId]
      });
      toast({
        title: "Success",
        description: "Internal note deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete internal note",
        variant: "destructive"
      });
    }
  });
  const handleAddInternalNote = () => {
    if (!newInternalNote.trim()) {
      toast({
        title: "Error",
        description: "Please enter a note",
        variant: "destructive"
      });
      return;
    }
    addInternalNoteMutation.mutate(newInternalNote);
  };
  const isLoading = notesV2Loading || clientLoading || internalNotesLoading;
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewingNote, setViewingNote] = useState<any>(null);
  const [editingNote, setEditingNote] = useState<any>(null);

  // Combine both types of notes
  const allNotes = [];

  // Add client notes if they exist
  if (clientData?.notes) {
    allNotes.push({
      id: 'client-notes',
      title: 'Conversion Notes',
      content: clientData.notes,
      created_at: clientData.created_at,
      created_by: {
        full_name: 'System'
      },
      // Default for conversion notes
      visibility: 'team',
      is_pinned: false,
      tags: ['conversion'],
      color: null
    });
  }

  // Add notes_v2
  allNotes.push(...notesV2);

  // Sort by created_at
  const notes = allNotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const getVisibilityIcon = (visibility: string) => {
    return visibility === 'private' ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />;
  };
  if (isLoading) {
    return <Card className="bg-white rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading notes...</div>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-6">
      {/* Internal Office Notes - Only visible to office_staff, admin, and note creators */}
      {(role === 'office_staff' || role === 'admin' || internalNotes && internalNotes.length > 0) && <Card className="bg-white rounded-2xl shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <CardTitle>Internal Office Notes</CardTitle>
                <Badge variant="outline" className="text-xs">Staff Only</Badge>
              </div>
              {!isAddingInternalNote && (role === 'office_staff' || role === 'admin') && <Button size="sm" onClick={() => setIsAddingInternalNote(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Note
                </Button>}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAddingInternalNote && <div className="space-y-2 p-4 bg-muted rounded-lg">
                <Textarea placeholder="Enter internal note (visible only to office staff and admins)..." value={newInternalNote} onChange={e => setNewInternalNote(e.target.value)} rows={3} />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => {
              setIsAddingInternalNote(false);
              setNewInternalNote('');
            }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAddInternalNote} disabled={addInternalNoteMutation.isPending}>
                    {addInternalNoteMutation.isPending ? <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </> : 'Save Note'}
                  </Button>
                </div>
              </div>}

            {internalNotesLoading ? <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div> : internalNotes && internalNotes.length > 0 ? <div className="space-y-3">
                {internalNotes.map((note: any) => <div key={note.id} className="p-4 rounded-lg border border-border bg-slate-50">
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
                      {(role === 'admin' || note.created_by === user?.id) && <Button size="sm" variant="ghost" onClick={() => {
                if (window.confirm('Are you sure you want to delete this note?')) {
                  deleteInternalNoteMutation.mutate(note.id);
                }
              }} disabled={deleteInternalNoteMutation.isPending} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>}
                    </div>
                  </div>)}
              </div> : <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm">No internal notes yet</p>
              </div>}
          </CardContent>
        </Card>}

      {/* Regular Notes */}
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className={isMobile ? "text-base font-semibold" : "text-xl font-semibold"}>Notes</CardTitle>
          <Button size="sm" className={`bg-primary hover:bg-primary/90 ${isMobile ? 'h-9' : ''}`} onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-1" />
            {isMobile ? 'Add' : 'Add Note'}
          </Button>
        </CardHeader>
        <CardContent className={isMobile ? "px-3 pb-3" : ""}>
        {notes.length === 0 ? <div className="text-center py-8 text-gray-500">
            <FileText className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} mx-auto mb-2 text-gray-300`} />
            <p className={isMobile ? "text-sm" : ""}>No notes added for this client</p>
          </div> : <div className={isMobile ? "space-y-2" : "space-y-4"}>
            {notes.map(note => <div key={note.id} className={`border rounded-lg ${isMobile ? 'p-3' : 'p-4'} hover:bg-gray-50 cursor-pointer transition-colors ${note.is_pinned ? 'border-primary/20 bg-primary/5' : ''} ${isMobile ? 'active:scale-95' : ''}`} onClick={() => setViewingNote(note)}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {note.is_pinned && <Pin className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-primary`} />}
                    <h3 className={`${isMobile ? 'text-sm' : ''} font-medium text-gray-900`}>
                      {note.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getVisibilityIcon(note.visibility)}
                    <Badge variant="outline" className="text-xs">
                      {note.visibility}
                    </Badge>
                  </div>
                </div>
                
                {note.content && <div className={`text-gray-600 mb-3 ${isMobile ? 'text-xs' : 'text-sm'} whitespace-pre-wrap`}>
                    {note.id === 'client-notes' ?
              // Show full content for conversion notes
              note.content :
              // Show truncated content for other notes
              <>
                        {note.content.substring(0, isMobile ? 100 : 200)}
                        {note.content.length > (isMobile ? 100 : 200) ? '...' : ''}
                      </>}
                  </div>}

                {note.tags && note.tags.length > 0 && <div className="flex flex-wrap gap-1 mb-3">
                    {note.tags.map((tag: string, index: number) => <Badge key={index} variant="default" className="text-xs">
                        {tag}
                      </Badge>)}
                  </div>}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    By {note.created_by?.full_name} • {format(new Date(note.created_at), 'dd/MM/yyyy')}
                  </span>
                  {note.color && <div className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} rounded-full border border-gray-200`} style={{
                backgroundColor: note.color
              }} />}
                </div>
              </div>)}
          </div>}
        </CardContent>
      </Card>

      <CreateNoteMultiModal open={showCreateDialog} onClose={() => setShowCreateDialog(false)} clientId={clientId} />

      <NoteViewDialog note={viewingNote} open={!!viewingNote} onClose={() => setViewingNote(null)} onEdit={() => {
      setEditingNote(viewingNote);
      setViewingNote(null);
    }} />

      <EditNoteDialog note={editingNote} open={!!editingNote} onClose={() => setEditingNote(null)} />
    </div>;
};