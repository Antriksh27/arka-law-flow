
import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { DocumentsSidebar } from '../components/documents/DocumentsSidebar';
import { DocumentsMainView } from '../components/documents/DocumentsMainView';
import { DocumentsHeader } from '../components/documents/DocumentsHeader';

const Documents = () => {
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    fileType: '',
    uploadedBy: '',
    caseId: ''
  });

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-120px)] bg-legal-background">
        <DocumentsHeader 
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedFilters={selectedFilters}
          onFiltersChange={setSelectedFilters}
        />
        
        <div className="flex h-full border-t border-gray-200">
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
    </DashboardLayout>
  );
};

export default Documents;
