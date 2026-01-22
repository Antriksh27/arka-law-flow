import React, { useState } from 'react';
import { DocumentsSidebar } from '../components/documents/DocumentsSidebar';
import { DocumentsMainView } from '../components/documents/DocumentsMainView';
import { DocumentsFilterBar } from '../components/documents/DocumentsFilterBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileStickyHeader } from '@/components/mobile/MobileStickyHeader';
import { MobileFAB } from '@/components/mobile/MobileFAB';
import { Upload, FolderOpen } from 'lucide-react';
import { UploadDocumentDialog } from '@/components/documents/UploadDocumentDialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useQueryClient } from '@tanstack/react-query';

const Documents = () => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    fileType: 'all',
    uploadedBy: 'all',
    caseId: 'all',
    clientId: 'all'
  });
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showFolderSheet, setShowFolderSheet] = useState(false);
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    queryClient.invalidateQueries({ queryKey: ['document-folders'] });
    queryClient.invalidateQueries({ queryKey: ['document-folder-structure'] });
  };

  const activeFiltersCount = [
    selectedFilters.fileType !== 'all',
    selectedFilters.uploadedBy !== 'all',
    selectedFilters.caseId !== 'all',
    selectedFilters.clientId !== 'all',
  ].filter(Boolean).length;

  if (isMobile) {
    return (
      <div className="h-full min-h-0 flex flex-col bg-background">
        <MobileStickyHeader
          title="Documents"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search documents..."
          onFilterClick={() => setShowFiltersSheet(true)}
          activeFiltersCount={activeFiltersCount}
          headerActions={
            <button 
              onClick={() => setShowFolderSheet(true)}
              className="p-2 rounded-lg active:scale-95 transition-transform"
            >
              <FolderOpen className="w-5 h-5 text-foreground" />
            </button>
          }
        />
        
        <div className="flex-1 min-h-0 overflow-y-auto pb-24">
          <DocumentsMainView
            selectedFolder={selectedFolder}
            viewMode={viewMode}
            searchQuery={searchQuery}
            selectedFilters={selectedFilters}
          />
        </div>

        {/* Mobile Folder Sheet */}
        <Sheet open={showFolderSheet} onOpenChange={setShowFolderSheet}>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Folders</SheetTitle>
            </SheetHeader>
            <DocumentsSidebar
              selectedFolder={selectedFolder}
              onFolderSelect={(folder) => {
                setSelectedFolder(folder);
                setShowFolderSheet(false);
              }}
            />
          </SheetContent>
        </Sheet>

        <MobileFAB 
          onClick={() => setShowUploadDialog(true)}
          icon={Upload}
          label="Upload"
        />

        <UploadDocumentDialog 
          open={showUploadDialog} 
          onClose={() => setShowUploadDialog(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">Manage and organize your legal documents</p>
        </div>
      </div>

      {/* Filter Bar */}
      <DocumentsFilterBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedFilters={selectedFilters}
        onFiltersChange={setSelectedFilters}
        onUploadClick={() => setShowUploadDialog(true)}
      />
      
      {/* Main Content with Sidebar */}
      <div className="flex gap-6 h-[calc(100vh-280px)]">
        {/* Sidebar Card */}
        <div className="w-72 bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col">
          <DocumentsSidebar
            selectedFolder={selectedFolder}
            onFolderSelect={setSelectedFolder}
          />
        </div>
        
        {/* Documents Grid/List Card */}
        <div className="flex-1 bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <DocumentsMainView
            selectedFolder={selectedFolder}
            viewMode={viewMode}
            searchQuery={searchQuery}
            selectedFilters={selectedFilters}
          />
        </div>
      </div>

      <UploadDocumentDialog 
        open={showUploadDialog} 
        onClose={() => setShowUploadDialog(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default Documents;
