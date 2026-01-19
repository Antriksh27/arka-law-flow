
import React, { useState } from 'react';
import { DocumentsSidebar } from '../components/documents/DocumentsSidebar';
import { DocumentsMainView } from '../components/documents/DocumentsMainView';
import { DocumentsHeader } from '../components/documents/DocumentsHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileHeader } from '@/components/mobile/MobileHeader';

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
    caseId: 'all'
  });
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showFolderSheet, setShowFolderSheet] = useState(false);

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    queryClient.invalidateQueries({ queryKey: ['document-folders'] });
  };

  if (isMobile) {
    return (
      <>
        <MobileHeader 
          title="Documents"
          actions={
            <button 
              onClick={() => setShowFolderSheet(true)}
              className="p-2 rounded-lg active:scale-95 transition-transform"
            >
              <FolderOpen className="w-5 h-5 text-foreground" />
            </button>
          }
        />
        
        <div className="pb-24">
          <DocumentsHeader 
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedFilters={selectedFilters}
            onFiltersChange={setSelectedFilters}
          />
          
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
      </>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <DocumentsHeader 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedFilters={selectedFilters}
        onFiltersChange={setSelectedFilters}
      />
      
      <div className="h-[calc(100vh-200px)] flex border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        <DocumentsSidebar
          selectedFolder={selectedFolder}
          onFolderSelect={setSelectedFolder}
        />
        
        <DocumentsMainView
          selectedFolder={selectedFolder}
          viewMode={viewMode}
          searchQuery={searchQuery}
          selectedFilters={selectedFilters}
        />
      </div>
    </div>
  );
};

export default Documents;

