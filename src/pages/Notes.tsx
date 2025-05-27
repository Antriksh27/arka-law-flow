
import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { NotesGrid } from '../components/notes/NotesGrid';
import { NotesHeader } from '../components/notes/NotesHeader';
import { CreateNoteMultiModal } from '../components/notes/CreateNoteMultiModal';
import { EditNoteDialog } from '../components/notes/EditNoteDialog';

const Notes = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('all-colors');
  const [selectedVisibility, setSelectedVisibility] = useState<string>('all-visibility');
  const [selectedCase, setSelectedCase] = useState<string>('all-cases');

  const handleColorChange = (value: string) => {
    setSelectedColor(value);
  };

  const handleVisibilityChange = (value: string) => {
    setSelectedVisibility(value);
  };

  const handleCaseChange = (value: string) => {
    setSelectedCase(value);
  };

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
          onColorChange={handleColorChange}
          selectedVisibility={selectedVisibility}
          onVisibilityChange={handleVisibilityChange}
          selectedCase={selectedCase}
          onCaseChange={handleCaseChange}
        />
        
        <NotesGrid
          searchQuery={searchQuery}
          selectedTags={selectedTags}
          selectedColor={selectedColor}
          selectedVisibility={selectedVisibility}
          selectedCase={selectedCase}
          onEditNote={setEditingNote}
        />

        <CreateNoteMultiModal
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
