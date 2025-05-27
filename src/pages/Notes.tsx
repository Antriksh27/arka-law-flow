
import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { NotesGrid } from '../components/notes/NotesGrid';
import { NotesHeader } from '../components/notes/NotesHeader';
import { CreateNoteDialog } from '../components/notes/CreateNoteDialog';
import { EditNoteDialog } from '../components/notes/EditNoteDialog';

const Notes = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedVisibility, setSelectedVisibility] = useState<string>('');
  const [selectedCase, setSelectedCase] = useState<string>('');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <NotesHeader
          onCreateNote={() => setShowCreateDialog(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
          selectedVisibility={selectedVisibility}
          onVisibilityChange={setSelectedVisibility}
          selectedCase={selectedCase}
          onCaseChange={setSelectedCase}
        />
        
        <NotesGrid
          searchQuery={searchQuery}
          selectedTags={selectedTags}
          selectedColor={selectedColor}
          selectedVisibility={selectedVisibility}
          selectedCase={selectedCase}
          onEditNote={setEditingNote}
        />

        <CreateNoteDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
        />

        {editingNote && (
          <EditNoteDialog
            note={editingNote}
            open={!!editingNote}
            onClose={() => setEditingNote(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Notes;
