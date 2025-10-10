import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Upload, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { UploadDocumentDialog } from '@/components/documents/UploadDocumentDialog';
import { toast } from 'sonner';

interface DocumentsTabProps {
  caseId: string;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ caseId }) => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['case-documents', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*, profiles(full_name)')
        .eq('case_id', caseId)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: legalkartDocuments } = useQuery({
    queryKey: ['legalkart-documents', caseId],
    queryFn: async () => {
      const { data } = await supabase
        .from('legalkart_documents' as any)
        .select('*')
        .eq('case_id', caseId)
        .order('document_filed', { ascending: false });
      
      return data || [];
    }
  });

  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-documents', caseId] });
      toast.success('Document deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete document');
    }
  });

  const handleDownload = async (document: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_url);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.file_name;
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
    queryClient.invalidateQueries({ queryKey: ['case-documents', caseId] });
    toast.success('Document uploaded successfully');
    setShowUploadDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Create Document Upload Form */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Upload Documents</h3>
        <Button
          onClick={() => setShowUploadDialog(true)}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading documents...</p>
          </div>
        ) : documents && documents.length > 0 ? (
          documents.map((doc: any) => (
            <div key={doc.id} className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-3 flex-1">
                <FileText className="w-5 h-5 text-primary mt-1" />
                <div className="flex-1">
                  <p className="font-medium">{doc.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(doc.file_size)} • {doc.uploaded_at ? format(new Date(doc.uploaded_at), 'dd/MM/yyyy') : 'N/A'}
                  </p>
                  {doc.notes && (
                    <p className="text-sm text-muted-foreground mt-1">{doc.notes}</p>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    Uploaded by {doc.profiles?.full_name || 'Unknown'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteDocument.mutate(doc.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No documents yet. Upload your first document above.</p>
          </div>
        )}
      </div>

      {/* Legalkart Documents */}
      {legalkartDocuments && legalkartDocuments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Court Documents (Legalkart)</h3>
          <div className="space-y-2">
            {legalkartDocuments.map((doc: any) => (
              <div key={doc.id} className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">{doc.document_filed || 'Court Document'}</p>
                  <p className="text-sm text-muted-foreground">
                    Filed: {doc.document_filed_date ? format(new Date(doc.document_filed_date), 'dd/MM/yyyy') : 'Date not available'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Document Dialog */}
      <UploadDocumentDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        caseId={caseId}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};
