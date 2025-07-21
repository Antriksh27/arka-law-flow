
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, Plus, File, Eye, FileText, Shield, Award, Copy, Clock } from 'lucide-react';
import { UploadDocumentForClientDialog } from '../documents/UploadDocumentForClientDialog';
import { FileViewer } from '../documents/FileViewer';

interface ClientDocumentsProps {
  clientId: string;
}

export const ClientDocuments: React.FC<ClientDocumentsProps> = ({ clientId }) => {
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);

  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          uploaded_by:profiles!documents_uploaded_by_fkey(full_name),
          document_type:document_types(name, category_code),
          case:cases(case_title, case_number)
        `)
        .eq('client_id', clientId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = async (document: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_url.split('/').slice(-2).join('/'));

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Could not download the file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUploadSuccess = () => {
    refetch();
  };

  const handleViewDocument = (document: any) => {
    setSelectedDocument(document);
    setShowFileViewer(true);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('pdf')) return FileText;
    if (fileType?.includes('image')) return File;
    if (fileType?.includes('doc')) return FileText;
    return File;
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading documents...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold">Documents</CardTitle>
          <Button 
            size="sm" 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setUploadDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
              <p className="text-gray-500 mb-4">Upload documents for this client to get started.</p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Upload First Document
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((document) => {
                const FileIcon = getFileIcon(document.file_type);
                return (
                  <div key={document.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <FileIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-gray-900 truncate pr-2">
                              {document.title || document.file_name}
                            </h3>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {document.confidential && (
                                <Badge variant="error" className="bg-red-100 text-red-700">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Confidential
                                </Badge>
                              )}
                              {document.certified_copy && (
                                <Badge variant="default" className="bg-blue-100 text-blue-700">
                                  <Award className="w-3 h-3 mr-1" />
                                  Certified
                                </Badge>
                              )}
                              {document.original_copy_retained && (
                                <Badge variant="success" className="bg-green-100 text-green-700">
                                  <Copy className="w-3 h-3 mr-1" />
                                  Original
                                </Badge>
                              )}
                            </div>
                          </div>

                          {document.notes && (
                            <p className="text-sm text-gray-600 mb-2">
                              {document.notes}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                            {document.document_type && (
                              <span className="font-medium text-blue-600">
                                {document.document_type.name}
                              </span>
                            )}
                            {document.case && (
                              <span>
                                Case: {document.case.case_title}
                                {document.case.case_number && ` (${document.case.case_number})`}
                              </span>
                            )}
                            <span>Size: {formatFileSize(document.file_size)}</span>
                            <span>Type: {document.file_type || 'Unknown'}</span>
                            {document.uploaded_by && (
                              <span>By: {document.uploaded_by.full_name}</span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(document.uploaded_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-500 hover:text-gray-700"
                          onClick={() => handleViewDocument(document)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(document)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <UploadDocumentForClientDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        clientId={clientId}
        onUploadSuccess={handleUploadSuccess}
      />

      <FileViewer
        open={showFileViewer}
        onClose={() => setShowFileViewer(false)}
        document={selectedDocument}
      />
    </>
  );
};
