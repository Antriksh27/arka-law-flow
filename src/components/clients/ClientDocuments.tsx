import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, Plus, File, Eye, FileText, Shield, Award, Copy, Clock, TestTube } from 'lucide-react';
import { TimeUtils } from '@/lib/timeUtils';
import { UploadDocumentForClientDialog } from '../documents/UploadDocumentForClientDialog';
import { FileViewer } from '../documents/FileViewer';
import { uploadFileToWebDAV } from '@/lib/pydioIntegration';
import { useIsMobile } from '@/hooks/use-mobile';
interface ClientDocumentsProps {
  clientId: string;
}
export const ClientDocuments: React.FC<ClientDocumentsProps> = ({
  clientId
}) => {
  const isMobile = useIsMobile();
  const {
    toast
  } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const {
    data: documents = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('documents').select(`
          *,
          uploaded_by:profiles!documents_uploaded_by_fkey(full_name),
          document_type:document_types(name, category_code),
          case:cases(case_title, case_number)
        `).eq('client_id', clientId).order('uploaded_at', {
        ascending: false
      });
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
      const {
        data,
        error
      } = await supabase.storage.from('documents').download(document.file_url.split('/').slice(-2).join('/'));
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

  // Test WebDAV integration
  const testWebDAVIntegration = async () => {
    console.log('🧪 Testing WebDAV integration...');
    try {
      const result = await uploadFileToWebDAV({
        filename: 'test-file.txt',
        content: 'This is a test file content for WebDAV integration testing.'
      });
      console.log('🧪 Test result:', result);
      if (result.success) {
        toast({
          title: "WebDAV Test Successful",
          description: "Test file uploaded to WebDAV successfully!"
        });
      } else {
        toast({
          title: "WebDAV Test Failed",
          description: result.error || 'Unknown error occurred',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('🧪 Test error:', error);
      toast({
        title: "WebDAV Test Error",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
  };
  if (isLoading) {
    return <Card className="bg-white rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading documents...</div>
        </CardContent>
      </Card>;
  }

  if (isMobile) {
    return (
      <>
        <Card className="bg-white rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Documents</CardTitle>
            <Button size="sm" className="bg-primary hover:bg-primary/90 h-9" onClick={() => setUploadDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Upload
            </Button>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-base font-medium text-gray-900 mb-2">No documents yet</h3>
                <p className="text-sm text-gray-500 mb-4">Upload documents to get started.</p>
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map(document => {
                  const FileIcon = getFileIcon(document.file_type);
                  return (
                    <Card key={document.id} className="active:scale-95 transition-transform">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2 mb-2">
                          <FileIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm text-gray-900 truncate">
                              {document.title || document.file_name}
                            </h3>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 flex-wrap mb-2">
                          {document.confidential && (
                            <Badge variant="error" className="bg-red-100 text-red-700 text-xs">
                              <Shield className="w-2.5 h-2.5 mr-0.5" />
                              Confidential
                            </Badge>
                          )}
                          {document.certified_copy && (
                            <Badge variant="default" className="bg-blue-100 text-blue-700 text-xs">
                              <Award className="w-2.5 h-2.5 mr-0.5" />
                              Cert
                            </Badge>
                          )}
                          {document.original_copy_retained && (
                            <Badge variant="success" className="bg-green-100 text-green-700 text-xs">
                              <Copy className="w-2.5 h-2.5 mr-0.5" />
                              Original
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs text-gray-500 mb-2">
                          {formatFileSize(document.file_size)} • {document.file_type || 'Unknown'}
                        </div>

                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                          <Clock className="w-3 h-3" />
                          {TimeUtils.formatDate(document.uploaded_at)}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="flex-1 h-8"
                            onClick={() => handleViewDocument(document)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 h-8"
                            onClick={() => handleDownload(document)}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
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
  }

  return <>
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold">Documents</CardTitle>
          <div className="flex gap-2">
            
            <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => setUploadDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
              <p className="text-gray-500 mb-4">Upload documents for this client to get started.</p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Upload First Document
              </Button>
            </div> : <div className="space-y-4">
              {documents.map(document => {
            const FileIcon = getFileIcon(document.file_type);
            return <div key={document.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <FileIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-gray-900 truncate pr-2">
                              {document.title || document.file_name}
                            </h3>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {document.confidential && <Badge variant="error" className="bg-red-100 text-red-700">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Confidential
                                </Badge>}
                              {document.certified_copy && <Badge variant="default" className="bg-blue-100 text-blue-700">
                                  <Award className="w-3 h-3 mr-1" />
                                  Certified
                                </Badge>}
                              {document.original_copy_retained && <Badge variant="success" className="bg-green-100 text-green-700">
                                  <Copy className="w-3 h-3 mr-1" />
                                  Original
                                </Badge>}
                            </div>
                          </div>

                          {document.notes && <p className="text-sm text-gray-600 mb-2">
                              {document.notes}
                            </p>}

                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                            {document.document_type && <span className="font-medium text-blue-600">
                                {document.document_type.name}
                              </span>}
                            {document.case && <span>
                                Case: {document.case.case_title}
                                {document.case.case_number && ` (${document.case.case_number})`}
                              </span>}
                            <span>Size: {formatFileSize(document.file_size)}</span>
                            <span>Type: {document.file_type || 'Unknown'}</span>
                            {document.uploaded_by && <span>By: {document.uploaded_by.full_name}</span>}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {TimeUtils.formatDate(document.uploaded_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700" onClick={() => handleViewDocument(document)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownload(document)}>
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>;
          })}
            </div>}
        </CardContent>
      </Card>

      <UploadDocumentForClientDialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} clientId={clientId} onUploadSuccess={handleUploadSuccess} />

      <FileViewer open={showFileViewer} onClose={() => setShowFileViewer(false)} document={selectedDocument} />
    </>;
};