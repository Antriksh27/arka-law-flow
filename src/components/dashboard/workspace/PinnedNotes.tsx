import { Plus, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { CreateNoteMultiModal } from '@/components/notes/CreateNoteMultiModal';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import TimeUtils from '@/lib/timeUtils';
import { bg } from '@/lib/colors';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  color?: string;
}
interface PinnedNotesProps {
  notes: Note[];
  isLoading?: boolean;
}
export const PinnedNotes = ({
  notes,
  isLoading
}: PinnedNotesProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const handleDeleteNote = async () => {
    if (!noteToDelete) return;
    try {
      const {
        error
      } = await supabase.from('notes_v2').delete().eq('id', noteToDelete);
      if (error) throw error;
      toast({
        title: "Note deleted",
        description: "The note has been removed successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard-data']
      });
      setNoteToDelete(null);
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete the note. Please try again.",
        variant: "destructive"
      });
    }
  };
  if (isLoading) {
    return <div className="mb-4 md:mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg md:text-xl">📌</span>
            <h2 className="text-lg md:text-xl font-semibold">Pinned Notes</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {[1, 2].map(i => <div key={i} className={`h-32 ${bg.muted} rounded-lg animate-pulse`} />)}
        </div>
      </div>;
  }
  const getNoteColor = (index: number) => {
    const colors = ['bg-yellow-50 border-yellow-200', 'bg-blue-50 border-blue-200', 'bg-green-50 border-green-200', 'bg-purple-50 border-purple-200'];
    return colors[index % colors.length];
  };
  return <>
      <div className="mb-4 md:mb-6">
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            
            <h2 className="text-lg md:text-xl font-semibold truncate">Pinned Notes</h2>
          </div>
          <Button size="sm" onClick={() => setShowCreateDialog(true)} className="bg-slate-900 hover:bg-slate-800 text-slate-50 flex-shrink-0 text-xs md:text-sm">
            + Add
          </Button>
        </div>

        {notes.length === 0 ? <Card className="p-6 md:p-8 text-center border-dashed">
            <p className="text-sm text-muted-foreground mb-3">No pinned notes yet</p>
            <Button size="sm" variant="outline" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create your first note
            </Button>
          </Card> : <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {notes.slice(0, 4).map((note, index) => <Card key={note.id} className={`p-3 md:p-4 border-2 ${getNoteColor(index)} relative group cursor-pointer hover:shadow-md transition-shadow`}>
                <button onClick={() => setNoteToDelete(note.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground hover:text-foreground" />
                </button>
                <h3 className="font-medium text-sm mb-2 pr-6 truncate">{note.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {note.content}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {TimeUtils.formatDate(note.created_at)}
                </p>
              </Card>)}
          </div>}
      </div>

      <CreateNoteMultiModal open={showCreateDialog} onClose={() => setShowCreateDialog(false)} isPinned={true} />

      <AlertDialog open={!!noteToDelete} onOpenChange={open => !open && setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNote}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
};