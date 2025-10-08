import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface DocumentsTabProps {
  caseId: string;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ caseId }) => {
  const { data: documents, isLoading } = useQuery({
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
        <h3 className="text-lg font-semibold mb-4">Case Documents</h3>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading documents...</p>
          </div>
        ) : documents && documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{doc.file_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(doc.file_size)} • {format(new Date(doc.uploaded_at), 'PPP')}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                </Button>
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
              <div key={doc.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{doc.document_filed || 'Court Document'}</p>
                    <p className="text-sm text-muted-foreground">
                      Filed: {doc.document_filed_date ? format(new Date(doc.document_filed_date), 'PPP') : 'Date not available'}
                    </p>
                  </div>
                </div>
                {doc.document_link && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={doc.document_link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
