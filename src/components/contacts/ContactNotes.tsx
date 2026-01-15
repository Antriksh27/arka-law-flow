import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pin, Eye, EyeOff, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { CreateNoteMultiModal } from '@/components/notes/CreateNoteMultiModal';
import { NoteViewDialog } from '@/components/notes/NoteViewDialog';
import { EditNoteDialog } from '@/components/notes/EditNoteDialog';
import { useIsMobile } from '@/hooks/use-mobile';

interface ContactNotesProps {
  contactId: string;
}

export const ContactNotes: React.FC<ContactNotesProps> = ({ contactId }) => {
  const isMobile = useIsMobile();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewingNote, setViewingNote] = useState<any>(null);
  const [editingNote, setEditingNote] = useState<any>(null);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['contact-notes', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes_v2')
        .select(`
          *,
          created_by:profiles!notes_v2_created_by_fkey(full_name)
        `)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const getVisibilityIcon = (visibility: string) => {
    return visibility === 'private' 
      ? <EyeOff className="w-4 h-4 text-gray-400" /> 
      : <Eye className="w-4 h-4 text-gray-400" />;
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading notes...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className={isMobile ? "text-base font-semibold" : "text-xl font-semibold"}>
            Notes
          </CardTitle>
          <Button 
            size="sm" 
            className={`bg-primary hover:bg-primary/90 ${isMobile ? 'h-9' : ''}`} 
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            {isMobile ? 'Add' : 'Add Note'}
          </Button>
        </CardHeader>
        <CardContent className={isMobile ? "px-3 pb-3" : ""}>
          {notes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} mx-auto mb-2 text-gray-300`} />
              <p className={isMobile ? "text-sm" : ""}>No notes added for this contact</p>
            </div>
          ) : (
            <div className={isMobile ? "space-y-2" : "space-y-4"}>
              {notes.map(note => (
                <div 
                  key={note.id} 
                  className={`border rounded-lg ${isMobile ? 'p-3' : 'p-4'} hover:bg-gray-50 cursor-pointer transition-colors ${note.is_pinned ? 'border-primary/20 bg-primary/5' : ''} ${isMobile ? 'active:scale-95' : ''}`}
                  onClick={() => setViewingNote(note)}
                >
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
                  
                  {note.content && (
                    <div className={`text-gray-600 mb-3 ${isMobile ? 'text-xs' : 'text-sm'} whitespace-pre-wrap`}>
                      {note.content.substring(0, isMobile ? 100 : 200)}
                      {note.content.length > (isMobile ? 100 : 200) ? '...' : ''}
                    </div>
                  )}

                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {note.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="default" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      By {note.created_by?.full_name} • {format(new Date(note.created_at), 'dd/MM/yyyy')}
                    </span>
                    {note.color && (
                      <div 
                        className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} rounded-full border border-gray-200`}
                        style={{ backgroundColor: note.color }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateNoteMultiModal 
        open={showCreateDialog} 
        onClose={() => setShowCreateDialog(false)} 
        contactId={contactId} 
      />

      <NoteViewDialog 
        note={viewingNote} 
        open={!!viewingNote} 
        onClose={() => setViewingNote(null)} 
        onEdit={() => {
          setEditingNote(viewingNote);
          setViewingNote(null);
        }} 
      />

      <EditNoteDialog 
        note={editingNote} 
        open={!!editingNote} 
        onClose={() => setEditingNote(null)} 
      />
    </div>
  );
};
