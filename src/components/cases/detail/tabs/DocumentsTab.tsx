import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Upload, Download, Trash2, Plus } from 'lucide-react';
import TimeUtils from '@/lib/timeUtils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UploadDocumentDialog } from '@/components/documents/UploadDocumentDialog';
import { LegalkartDocumentsTable } from '@/components/cases/legalkart/LegalkartDocumentsTable';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
interface DocumentsTabProps {
  caseId: string;
}
export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  caseId
}) => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const queryClient = useQueryClient();
  const {
    data: documents,
    isLoading
  } = useQuery({
    queryKey: ['case-documents', caseId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('documents').select('*, profiles(full_name)').eq('case_id', caseId).order('uploaded_at', {
        ascending: false
      });
      if (error) throw error;
      // Filter out documents without proper data
      return data?.filter(doc => doc.file_name && doc.file_url) || [];
    }
  });
  const {
    data: legalkartDocuments,
    isLoading: isLoadingLegalkart
  } = useQuery({
    queryKey: ['legalkart-documents', caseId],
    queryFn: async () => {
      const {
        data
      } = await supabase.from('legalkart_documents' as any).select('*').eq('case_id', caseId).order('document_filed', {
        ascending: false
      });
      return data || [];
    }
  });
  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      const {
        error
      } = await supabase.from('documents').delete().eq('id', documentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['case-documents', caseId]
      });
      toast.success('Document deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete document');
    }
  });
  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const {
        data,
        error
      } = await supabase.storage.from('documents').download(filePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Document downloaded');
    } catch (error) {
      toast.error('Failed to download document');
    }
  };
  const formatFileSize = (bytes: number) => {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };
  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ['case-documents', caseId]
    });
    toast.success('Document uploaded successfully');
    setShowUploadDialog(false);
  };
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Documents</h3>
        <Button onClick={() => setShowUploadDialog(true)} size={isMobile ? "sm" : "default"}>
          <Plus className="w-4 h-4 mr-2" />
          Upload
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading documents...</div>
      ) : (
        <>
          {documents && documents.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Uploaded Documents</h4>
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-3`}>
                {documents.map((doc) => (
                  <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow bg-card border-border">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 rounded-lg p-2.5">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate text-foreground">{doc.file_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>•</span>
                          <span>{TimeUtils.formatDate(doc.uploaded_at, 'dd MMM')}</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(doc.file_url, doc.file_name)}
                            className="h-8 text-xs"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Delete this document?')) {
                                deleteDocument.mutate(doc.id);
                              }
                            }}
                            disabled={deleteDocument.isPending}
                            className="h-8 text-xs text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {isLoadingLegalkart ? (
            <div className="text-center py-4">Loading court documents...</div>
          ) : (
            legalkartDocuments && legalkartDocuments.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Court Documents</h4>
                <div className="text-sm text-muted-foreground">{legalkartDocuments.length} court documents</div>
              </div>
            )
          )}

          {!isLoading && !isLoadingLegalkart && 
           (!documents || documents.length === 0) && 
           (!legalkartDocuments || legalkartDocuments.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-sm">No documents yet. Tap + to upload.</p>
            </div>
          )}
        </>
      )}

      {showUploadDialog && (
        <UploadDocumentDialog
          open={showUploadDialog}
          onClose={handleUploadSuccess}
          caseId={caseId}
        />
      )}
    </div>
  );
};