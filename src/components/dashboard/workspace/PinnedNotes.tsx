import { Plus, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { CreateNoteDialog } from '@/components/notes/CreateNoteDialog';
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
  if (isLoading) {
    return <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📌</span>
            <h2 className="text-xl font-semibold">Pinned Notes</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      </div>;
  }
  const getNoteColor = (index: number) => {
    const colors = ['bg-yellow-50 border-yellow-200', 'bg-blue-50 border-blue-200', 'bg-green-50 border-green-200', 'bg-purple-50 border-purple-200'];
    return colors[index % colors.length];
  };
  return <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📌</span>
            <h2 className="text-xl font-semibold">Pinned Notes</h2>
          </div>
          <Button size="sm" onClick={() => setShowCreateDialog(true)} className="text-slate-900 bg-slate-900 hover:bg-slate-800">
            + Add Note
          </Button>
        </div>

        {notes.length === 0 ? <Card className="p-8 text-center border-dashed">
            <p className="text-sm text-muted-foreground mb-3">No pinned notes yet</p>
            <Button size="sm" variant="outline" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create your first note
            </Button>
          </Card> : <div className="grid grid-cols-2 gap-4">
            {notes.slice(0, 4).map((note, index) => <Card key={note.id} className={`p-4 border-2 ${getNoteColor(index)} relative group cursor-pointer hover:shadow-md transition-shadow`}>
                <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
                <h3 className="font-medium text-sm mb-2 pr-6">{note.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {note.content}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(note.created_at).toLocaleDateString()}
                </p>
              </Card>)}
          </div>}
      </div>

      {showCreateDialog && <CreateNoteDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />}
    </>;
};