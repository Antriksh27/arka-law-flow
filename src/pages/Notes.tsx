import React, { useState } from 'react';
import { NotesGrid } from '../components/notes/NotesGrid';
import { NotesHeader } from '../components/notes/NotesHeader';
import { CreateNoteMultiModal } from '../components/notes/CreateNoteMultiModal';
import { EditNoteDialog } from '../components/notes/EditNoteDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobilePageContainer } from '@/components/mobile/MobilePageContainer';
import { MobileFAB } from '@/components/mobile/MobileFAB';
import { MobileStickyHeader } from '@/components/mobile/MobileStickyHeader';
import { NotesFilterSheet } from '../components/notes/NotesFilterSheet';
import { MobileNotesView } from '../components/notes/MobileNotesView';
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
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);

  const handleColorChange = (value: string) => {
    setSelectedColor(value);
  };

  const handleVisibilityChange = (value: string) => {
    setSelectedVisibility(value);
  };

  const handleCaseChange = (value: string) => {
    setSelectedCase(value);
  };

  const activeFiltersCount = [
    selectedColor !== 'all-colors',
    selectedVisibility !== 'all-visibility',
    selectedCase !== 'all-cases',
    selectedTags.length > 0,
  ].filter(Boolean).length;

  // Mobile Layout
  if (isMobile) {
    return (
      <MobilePageContainer>
        {/* Mobile Sticky Header */}
        <MobileStickyHeader
          title="Notes"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search notes..."
          onFilterClick={() => setShowFiltersSheet(true)}
          activeFiltersCount={activeFiltersCount}
        />

        {/* Mobile Notes List */}
        <MobileNotesView
          searchQuery={searchQuery}
          selectedColor={selectedColor}
          selectedVisibility={selectedVisibility}
          selectedCase={selectedCase}
          onEditNote={setEditingNote}
        />

        {/* Mobile FAB */}
        <MobileFAB
          onClick={() => setShowCreateDialog(true)}
          icon={Plus}
        />

        {/* Create Note Modal */}
        <CreateNoteMultiModal
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
        />

        {/* Edit Note Dialog */}
        {editingNote && (
          <EditNoteDialog
            note={editingNote}
            open={!!editingNote}
            onClose={() => setEditingNote(null)}
          />
        )}

        {/* Mobile Filters Sheet */}
        <NotesFilterSheet
          open={showFiltersSheet}
          onClose={() => setShowFiltersSheet(false)}
          selectedColor={selectedColor}
          onColorChange={handleColorChange}
          selectedVisibility={selectedVisibility}
          onVisibilityChange={handleVisibilityChange}
          selectedCase={selectedCase}
          onCaseChange={handleCaseChange}
          onClearFilters={() => {
            setSelectedColor('all-colors');
            setSelectedVisibility('all-visibility');
            setSelectedCase('all-cases');
          }}
        />
      </MobilePageContainer>
    );
  }

  // Desktop Layout
  return (
    <MobilePageContainer>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
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
    </MobilePageContainer>
  );
};

export default Notes;
