import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileStickyHeader } from '@/components/mobile/MobileStickyHeader';
import { MobileFAB } from '@/components/mobile/MobileFAB';
import { Upload, RefreshCw, List, FolderTree, Search } from 'lucide-react';
import { MobileFolderView } from '@/components/documents/MobileFolderView';
import { DesktopFolderView } from '@/components/documents/DesktopFolderView';
import { UploadDocumentDialog } from '@/components/documents/UploadDocumentDialog';
import { DocumentsMainView } from '../components/documents/DocumentsMainView';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const Documents = () => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedFilters, setSelectedFilters] = useState({
    fileType: 'all',
    uploadedBy: 'all',
    caseId: 'all',
    clientId: 'all'
  });
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState<'folders' | 'list'>('folders');
  const [isBackfilling, setIsBackfilling] = useState(false);

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

  const handleBackfill = async () => {
    setIsBackfilling(true);
    try {
      const { data, error } = await supabase.functions.invoke('backfill-document-types');
      
      if (error) {
        toast({
          title: 'Backfill failed',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Backfill complete',
        description: `Updated: ${data.stats?.updated || 0}, Skipped: ${data.stats?.skipped || 0}, Errors: ${data.stats?.errors || 0}`,
      });
      
      // Refresh documents
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    } catch (err) {
      toast({
        title: 'Backfill error',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsBackfilling(false);
    }
  };

  if (isMobile) {
    return (
      <div className="h-full min-h-0 flex flex-col bg-background">
        <MobileStickyHeader
          title="Documents"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search documents..."
          headerActions={
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMobileViewMode(mobileViewMode === 'folders' ? 'list' : 'folders')}
                className="p-2 rounded-lg active:scale-95 transition-transform"
                aria-label="Toggle view"
              >
                {mobileViewMode === 'folders' ? (
                  <List className="w-5 h-5 text-foreground" />
                ) : (
                  <FolderTree className="w-5 h-5 text-foreground" />
                )}
              </button>
            </div>
          }
        />
        
        <div className="flex-1 min-h-0 overflow-y-auto pb-24">
          {mobileViewMode === 'folders' ? (
            <MobileFolderView searchQuery={searchQuery} />
          ) : (
            <DocumentsMainView
              selectedFolder={selectedFolder}
              viewMode="list"
              searchQuery={searchQuery}
              selectedFilters={selectedFilters}
            />
          )}
        </div>

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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUploadDialog(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBackfill}
            disabled={isBackfilling}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isBackfilling ? 'animate-spin' : ''}`} />
            {isBackfilling ? 'Backfilling...' : 'Backfill Types'}
          </Button>
        </div>
      </div>

      {/* Folder Structure */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden h-[calc(100vh-220px)]">
        <DesktopFolderView searchQuery={searchQuery} />
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
