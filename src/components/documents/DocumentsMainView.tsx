
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DocumentGrid } from './DocumentGrid';
import { DocumentList } from './DocumentList';
import { FileText } from 'lucide-react';

interface DocumentsMainViewProps {
  selectedFolder: string;
  viewMode: 'grid' | 'list';
  searchQuery: string;
  selectedFilters: {
    fileType: string;
    uploadedBy: string;
    caseId: string;
  };
}

export const DocumentsMainView: React.FC<DocumentsMainViewProps> = ({
  selectedFolder,
  viewMode,
  searchQuery,
  selectedFilters
}) => {
  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ['documents', selectedFolder, searchQuery, selectedFilters],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select(`
          *,
          profiles!documents_uploaded_by_fkey(full_name),
          cases!left(case_title)
        `)
        .order('uploaded_at', { ascending: false });

      // Parse the selectedFolder path to determine filter type
      // Format: "all", "recent", "starred", "client:uuid", "case:uuid", "primary:caseId:folderName", "sub:caseId:folderName:subType"
      if (selectedFolder === 'recent') {
        query = query.gte('uploaded_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      } else if (selectedFolder === 'starred') {
        query = query.eq('is_evidence', true);
      } else if (selectedFolder.startsWith('client:')) {
        const clientId = selectedFolder.replace('client:', '');
        if (clientId === 'no-client') {
          query = query.is('client_id', null);
        } else {
          query = query.eq('client_id', clientId);
        }
      } else if (selectedFolder.startsWith('case:')) {
        const caseId = selectedFolder.replace('case:', '');
        if (caseId === 'no-case') {
          query = query.is('case_id', null);
        } else {
          query = query.eq('case_id', caseId);
        }
      } else if (selectedFolder.startsWith('primary:')) {
        // Format: primary:caseId:folderName
        const parts = selectedFolder.split(':');
        const caseId = parts[1];
        const folderName = parts.slice(2).join(':'); // In case folder name has colons
        if (caseId === 'no-case') {
          query = query.is('case_id', null);
        } else {
          query = query.eq('case_id', caseId);
        }
        query = query.eq('folder_name', folderName);
      } else if (selectedFolder.startsWith('sub:')) {
        // Format: sub:caseId:folderName:subType
        const parts = selectedFolder.split(':');
        const caseId = parts[1];
        const folderName = parts[2];
        const subType = parts.slice(3).join(':');
        if (caseId === 'no-case') {
          query = query.is('case_id', null);
        } else {
          query = query.eq('case_id', caseId);
        }
        query = query.eq('folder_name', folderName);
        query = query.ilike('file_type', `%${subType.toLowerCase()}%`);
      } else if (selectedFolder !== 'all') {
        // Fallback: treat as folder_name for backward compatibility
        query = query.eq('folder_name', selectedFolder);
      }

      // Apply search
      if (searchQuery) {
        query = query.ilike('file_name', `%${searchQuery}%`);
      }

      // Apply filters - handle "all" values properly
      if (selectedFilters.fileType && selectedFilters.fileType !== 'all') {
        query = query.ilike('file_type', `%${selectedFilters.fileType}%`);
      }
      if (selectedFilters.caseId && selectedFilters.caseId !== 'all') {
        query = query.eq('case_id', selectedFilters.caseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || (selectedFilters.fileType && selectedFilters.fileType !== 'all') || (selectedFilters.caseId && selectedFilters.caseId !== 'all')
              ? 'Try adjusting your search or filters'
              : 'Upload your first document to get started'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white overflow-auto px-4 sm:px-0">
      {viewMode === 'grid' ? (
        <DocumentGrid documents={documents} onRefresh={refetch} />
      ) : (
        <DocumentList documents={documents} onRefresh={refetch} />
      )}
    </div>
  );
};
