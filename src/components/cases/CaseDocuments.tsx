import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Download, Eye, Star, StarOff } from 'lucide-react';
import { format } from 'date-fns';
import { UploadDocumentDialog } from '../documents/UploadDocumentDialog';
import { FileViewer } from '../documents/FileViewer';
import { useToast } from '@/hooks/use-toast';
import { getFileIcon } from '@/lib/fileUtils';
interface CaseDocumentsProps {
  caseId: string;
}
export const CaseDocuments: React.FC<CaseDocumentsProps> = ({
  caseId
}) => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const {
    toast
  } = useToast();

  // Fetch documents for this case
  const {
    data: documents = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['case-documents', caseId],
    queryFn: async () => {
      try {
        console.log('Fetching documents for case:', caseId);

        // Get documents for this case
        const {
          data: docs,
          error: docsError
        } = await supabase.from('documents').select('*').eq('case_id', caseId).order('uploaded_at', {
          ascending: false
        });
        if (docsError) {
          console.error('Error fetching documents:', docsError);
          throw docsError;
        }
        console.log('Documents fetched successfully:', docs?.length || 0);

        // Get uploader names separately
        if (docs && docs.length > 0) {
          const uploaderIds = [...new Set(docs.map(doc => doc.uploaded_by).filter(Boolean))];
          if (uploaderIds.length > 0) {
            const {
              data: profiles
            } = await supabase.from('profiles').select('id, full_name').in('id', uploaderIds);
            const profileMap = profiles?.reduce((acc, profile) => {
              acc[profile.id] = profile.full_name;
              return acc;
            }, {} as Record<string, string>) || {};
            return docs.map(doc => ({
              ...doc,
              uploader_name: profileMap[doc.uploaded_by] || 'Unknown User'
            }));
          }
        }
        return docs?.map(doc => ({
          ...doc,
          uploader_name: 'Unknown User'
        })) || [];
      } catch (error) {
        console.error('Error in document query:', error);
        throw error;
      }
    }
  });
  const handleUploadSuccess = () => {
    console.log('Upload successful, refreshing documents');
    refetch();
  };
  const handleViewDocument = (document: any) => {
    setSelectedDocument(document);
    setShowFileViewer(true);
  };
  const handleDownload = async (document: any) => {
    try {
      const {
        data,
        error
      } = await supabase.storage.from('documents').download(document.file_url);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
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
      refetch();
    } catch (error) {
      console.error('Toggle important error:', error);
      toast({
        title: "Failed to update document",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };
  if (isLoading) {
    return <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted">Loading documents...</p>
      </div>;
  }
  return <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Documents</h3>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>

        {documents && documents.length > 0 ? <div className="border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="table-header">Document Name</TableHead>
                  <TableHead className="table-header">Type</TableHead>
                  <TableHead className="table-header">Uploaded By</TableHead>
                  <TableHead className="table-header">Upload Date</TableHead>
                  <TableHead className="table-header">Size</TableHead>
                  <TableHead className="table-header">Important</TableHead>
                  <TableHead className="table-header">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map(doc => {
              const FileIcon = getFileIcon(doc.file_type);
              return <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileIcon className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{doc.file_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {doc.file_type?.toUpperCase() || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>{doc.uploader_name}</TableCell>
                      <TableCell>
                        {doc.uploaded_at ? format(new Date(doc.uploaded_at), 'MMM d, yyyy') : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => toggleImportant(doc)} className="p-1">
                          {doc.is_evidence ? <Star className="w-4 h-4 text-yellow-500 fill-current" /> : <StarOff className="w-4 h-4 text-gray-400" />}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>;
            })}
              </TableBody>
            </Table>
          </div> : <div className="text-center py-12 text-muted">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted" />
            <p>No documents uploaded yet</p>
            <Button className="mt-4" onClick={() => setShowUploadDialog(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload First Document
            </Button>
          </div>}
      </div>

      <UploadDocumentDialog open={showUploadDialog} onClose={() => setShowUploadDialog(false)} caseId={caseId} onUploadSuccess={handleUploadSuccess} />

      <FileViewer open={showFileViewer} onClose={() => setShowFileViewer(false)} document={selectedDocument} />
    </>;
};