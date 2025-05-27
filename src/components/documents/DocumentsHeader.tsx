
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Search, Filter, Grid3X3, List, Plus } from 'lucide-react';
import { UploadDocumentDialog } from './UploadDocumentDialog';

interface DocumentsHeaderProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedFilters: {
    fileType: string;
    uploadedBy: string;
    caseId: string;
  };
  onFiltersChange: (filters: any) => void;
}

export const DocumentsHeader: React.FC<DocumentsHeaderProps> = ({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  selectedFilters,
  onFiltersChange
}) => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
            
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 w-64 bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              
              <Select 
                value={selectedFilters.fileType} 
                onValueChange={(value) => onFiltersChange({...selectedFilters, fileType: value})}
              >
                <SelectTrigger className="w-32 h-9 bg-gray-50 border-gray-200">
                  <SelectValue placeholder="File Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="docx">Word</SelectItem>
                  <SelectItem value="jpg">Images</SelectItem>
                  <SelectItem value="txt">Text</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={selectedFilters.caseId} 
                onValueChange={(value) => onFiltersChange({...selectedFilters, caseId: value})}
              >
                <SelectTrigger className="w-32 h-9 bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Case" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cases</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className="h-8 px-3"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className="h-8 px-3"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* Upload Button */}
            <Button onClick={() => setShowUploadDialog(true)} className="bg-slate-800 hover:bg-slate-700 text-white">
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>
      </div>

      <UploadDocumentDialog 
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
      />
    </>
  );
};
