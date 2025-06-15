
import React, { useState } from 'react';
import { DocumentsSidebar } from '../components/documents/DocumentsSidebar';
import { DocumentsMainView } from '../components/documents/DocumentsMainView';
import { DocumentsHeader } from '../components/documents/DocumentsHeader';

const Documents = () => {
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    fileType: 'all',
    uploadedBy: 'all',
    caseId: 'all'
  });

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

