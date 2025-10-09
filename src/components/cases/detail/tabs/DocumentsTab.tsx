import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { UploadDocumentDialog } from '@/components/documents/UploadDocumentDialog';
import { toast } from 'sonner';

interface DocumentsTabProps {
  caseId: string;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ caseId }) => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const { data: documents, isLoading, refetch } = useQuery({
    queryKey: ['case-documents', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
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

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Case Documents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Case Documents</h3>
          <Button
            onClick={() => setShowUploadDialog(true)}
            size="sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading documents...</p>
          </div>
        ) : documents && documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc: any) => (
              <div key={doc.id} className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">{doc.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(doc.file_size)} • {doc.uploaded_at ? format(new Date(doc.uploaded_at), 'dd/MM/yyyy') : 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-border rounded-lg">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No documents uploaded yet</p>
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
        onUploadSuccess={() => {
          refetch();
          toast.success('Document uploaded successfully');
          setShowUploadDialog(false);
        }}
      />
    </div>
  );
};
