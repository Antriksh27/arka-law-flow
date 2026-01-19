
import React, { useState } from 'react';
import { NotesGrid } from '../components/notes/NotesGrid';
import { NotesHeader } from '../components/notes/NotesHeader';
import { CreateNoteMultiModal } from '../components/notes/CreateNoteMultiModal';
import { EditNoteDialog } from '../components/notes/EditNoteDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobilePageContainer } from '@/components/mobile/MobilePageContainer';
import { MobileFAB } from '@/components/mobile/MobileFAB';

import { Plus } from 'lucide-react';

const Notes = () => {
  const isMobile = useIsMobile();
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
    <MobilePageContainer>
      <div className={isMobile ? "" : "max-w-7xl mx-auto p-6 space-y-6"}>
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

      {/* Mobile FAB */}
      {isMobile && (
        <MobileFAB
          onClick={() => setShowCreateDialog(true)}
          icon={Plus}
        />
      )}


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
    </MobilePageContainer>
  );
};

export default Notes;
