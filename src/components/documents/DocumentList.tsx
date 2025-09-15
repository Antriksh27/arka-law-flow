import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Star, StarOff, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { getFileIcon } from '@/lib/fileUtils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileViewer } from './FileViewer';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';

interface DocumentListProps {
  documents: any[];
  onRefresh: () => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onRefresh
}) => {
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<any>(null);
  const {
    toast
  } = useToast();
  const handleViewDocument = (document: any) => {
    setSelectedDocument(document);
    setShowFileViewer(true);
  };
  const handleDownload = async (doc: any) => {
    try {
      // For WebDAV-synced documents, try to download from WebDAV first
      if (doc.webdav_synced && doc.webdav_path) {
        const { data: webdavResult, error: webdavError } = await supabase.functions.invoke('pydio-webdav', {
          body: {
            operation: 'download',
            filePath: doc.webdav_path
          }
        });
        
        if (!webdavError && webdavResult?.success) {
          // Convert base64 to blob and download
          const base64 = webdavResult.content;
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes]);
          
          const url = URL.createObjectURL(blob);
          const a = window.document.createElement('a');
          a.href = url;
          a.download = doc.file_name;
          window.document.body.appendChild(a);
          a.click();
          window.document.body.removeChild(a);
          URL.revokeObjectURL(url);
          return;
        }
      }
      
      // Fallback to Supabase storage if WebDAV fails or not synced
      const { data, error } = await supabase.storage.from('documents').download(doc.file_url);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the document",
        variant: "destructive"
      });
    }
  };
  const toggleImportant = async (document: any) => {
    try {
      const {
        error
      } = await supabase.from('documents').update({
        is_evidence: !document.is_evidence
      }).eq('id', document.id);
      if (error) throw error;
      toast({
        title: document.is_evidence ? "Removed from important" : "Marked as important",
        description: `Document ${document.is_evidence ? 'unmarked' : 'marked'} as important`
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "Failed to update document",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };
  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };
  return (
    <>
      <div className="p-6">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200">
              <TableHead className="bg-gray-50 text-gray-700 font-medium">Name</TableHead>
              <TableHead className="bg-gray-50 text-gray-700 font-medium">Type</TableHead>
              <TableHead className="bg-gray-50 text-gray-700 font-medium">Case</TableHead>
              <TableHead className="bg-gray-50 text-gray-700 font-medium">Uploaded By</TableHead>
              <TableHead className="bg-gray-50 text-gray-700 font-medium">Date</TableHead>
              <TableHead className="bg-gray-50 text-gray-700 font-medium">Size</TableHead>
              <TableHead className="bg-gray-50 text-gray-700 font-medium">Important</TableHead>
              <TableHead className="bg-gray-50 text-gray-700 font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map(doc => {
              const FileIcon = getFileIcon(doc.file_type);
              return (
                <TableRow key={doc.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <FileIcon className="w-8 h-8 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900">{doc.file_name}</p>
                        <p className="text-sm text-gray-500">{doc.folder_name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {doc.file_type?.toUpperCase() || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {doc.cases?.title || 'General'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {doc.profiles?.full_name || 'Unknown'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {formatFileSize(doc.file_size)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => toggleImportant(doc)} className="p-1">
                      {doc.is_evidence ? (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      ) : (
                        <StarOff className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="p-1" onClick={() => handleViewDocument(doc)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-1" onClick={() => handleDownload(doc)}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-1 hover:text-red-600" 
                        onClick={() => setDocumentToDelete(doc)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <FileViewer
        open={showFileViewer}
        onClose={() => setShowFileViewer(false)}
        document={selectedDocument}
      />

      <DeleteDocumentDialog
        open={!!documentToDelete}
        onClose={() => setDocumentToDelete(null)}
        document={documentToDelete}
        onDeleted={onRefresh}
      />
    </>
  );
};
