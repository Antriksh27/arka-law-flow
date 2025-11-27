
import React, { useState } from 'react';
import { Search, Grid3X3, List, Filter, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  const [showFilters, setShowFilters] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch cases for filter dropdown
  const { data: cases = [] } = useQuery({
    queryKey: ['cases-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title')
        .order('case_title');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch users for filter dropdown
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');
      if (error) throw error;
      return data || [];
    }
  });

  const handleUploadSuccess = () => {
    // Invalidate queries to refresh document list
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    queryClient.invalidateQueries({ queryKey: ['document-folders'] });
  };

  return (
    <div className="bg-white border-b border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-1">Manage and organize your legal documents</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          
          <div className="flex border border-gray-300 rounded-lg bg-white">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className={viewMode === 'grid' ? 'bg-gray-100' : ''}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className={viewMode === 'list' ? 'bg-gray-100' : ''}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <Button 
            onClick={() => setShowUploadDialog(true)}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Documents
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Type
            </label>
            <Select
              value={selectedFilters.fileType}
              onValueChange={(value) => 
                onFiltersChange({ ...selectedFilters, fileType: value })
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="doc">Word Documents</SelectItem>
                <SelectItem value="jpg">Images</SelectItem>
                <SelectItem value="txt">Text Files</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Uploaded By
            </label>
            <Select
              value={selectedFilters.uploadedBy}
              onValueChange={(value) => 
                onFiltersChange({ ...selectedFilters, uploadedBy: value })
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Case
            </label>
            <Select
              value={selectedFilters.caseId}
              onValueChange={(value) => 
                onFiltersChange({ ...selectedFilters, caseId: value })
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="All cases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cases</SelectItem>
                {cases.map((case_item) => (
                  <SelectItem key={case_item.id} value={case_item.id}>
                    {case_item.case_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <UploadDocumentDialog 
        open={showUploadDialog} 
        onClose={() => setShowUploadDialog(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};
