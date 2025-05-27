
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Download, Eye, Star, StarOff } from 'lucide-react';
import { format } from 'date-fns';
import { UploadDocumentDialog } from '../documents/UploadDocumentDialog';
import { useToast } from '@/hooks/use-toast';
import { getFileIcon } from '@/lib/fileUtils';

interface CaseDocumentsProps {
  caseId: string;
}

export const CaseDocuments: React.FC<CaseDocumentsProps> = ({ caseId }) => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();

  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ['case-documents', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          profiles!documents_uploaded_by_fkey(full_name)
        `)
        .eq('case_id', caseId)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const handleUploadSuccess = () => {
    refetch();
  };

  const handleDownload = async (document: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_url);

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
      toast({
        title: "Download failed",
        description: "Failed to download the document",
        variant: "destructive"
      });
    }
  };

  const toggleImportant = async (document: any) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ is_evidence: !document.is_evidence })
        .eq('id', document.id);

      if (error) throw error;
      
      toast({
        title: document.is_evidence ? "Removed from important" : "Marked as important",
        description: `Document ${document.is_evidence ? 'unmarked' : 'marked'} as important`
      });
      
      refetch();
    } catch (error) {
      toast({
        title: "Failed to update document",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading documents...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Documents</h3>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>

        {documents && documents.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Important</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map(doc => {
                  const FileIcon = getFileIcon(doc.file_type);
                  
                  return (
                    <TableRow key={doc.id}>
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
                      <TableCell>{doc.profiles?.full_name || 'Unknown'}</TableCell>
                      <TableCell>{format(new Date(doc.uploaded_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleImportant(doc)}
                          className="p-1"
                        >
                          {doc.is_evidence ? (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          ) : (
                            <StarOff className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No documents uploaded yet</p>
            <Button className="mt-4" onClick={() => setShowUploadDialog(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload First Document
            </Button>
          </div>
        )}
      </div>

      <UploadDocumentDialog 
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        caseId={caseId}
        onUploadSuccess={handleUploadSuccess}
      />
    </>
  );
};
