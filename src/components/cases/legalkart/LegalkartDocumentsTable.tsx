import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, AlertCircle, Eye, Download, FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import IframeViewer from '@/components/documents/IframeViewer';

interface LegalkartDocumentsTableProps {
  caseId: string;
}

interface DocumentData {
  id: string;
  sr_no: string;
  advocate: string;
  filed_by: string;
  document_no: string;
  document_filed: string;
  date_of_receiving: string;
  pdf_base64?: string;
  document_link?: string;
}

// Helper function to avoid TypeScript inference issues
const fetchDocuments = async (caseId: string): Promise<DocumentData[]> => {
  try {
    const { fetchLegalkartCaseId } = await import('./utils');
    const lkCaseId = await fetchLegalkartCaseId(caseId);
    if (!lkCaseId) return [];

    const { data, error } = await (supabase as any)
      .from('legalkart_case_documents')
      .select('*')
      .eq('legalkart_case_id', lkCaseId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '-';
  }
};

export const LegalkartDocumentsTable: React.FC<LegalkartDocumentsTableProps> = ({ caseId }) => {
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerTitle, setViewerTitle] = useState('');

  const { data: documents, isLoading } = useQuery<DocumentData[]>({
    queryKey: ['legalkart-documents', caseId],
    queryFn: () => fetchDocuments(caseId),
    enabled: !!caseId
  });

  const convertBase64ToBlobUrl = (base64: string): string => {
    try {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error converting base64:', error);
      return '';
    }
  };

  const handleView = (doc: DocumentData) => {
    if (doc.pdf_base64) {
      const blobUrl = convertBase64ToBlobUrl(doc.pdf_base64);
      setViewerUrl(blobUrl);
      setViewerTitle(doc.document_filed || 'Document');
      setViewerOpen(true);
    } else if (doc.document_link) {
      setViewerUrl(doc.document_link);
      setViewerTitle(doc.document_filed || 'Document');
      setViewerOpen(true);
    }
  };

  const handleDownload = (doc: DocumentData) => {
    if (doc.pdf_base64) {
      const blobUrl = convertBase64ToBlobUrl(doc.pdf_base64);
      window.open(blobUrl, '_blank');
    } else if (doc.document_link) {
      window.open(doc.document_link, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse flex space-x-4">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No documents found for this case</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle className="w-4 h-4" />
        <span>{documents.length} document(s) found</span>
      </div>
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Sr No</TableHead>
              <TableHead>Advocate</TableHead>
              <TableHead>Filed By</TableHead>
              <TableHead>Document No</TableHead>
              <TableHead>Document Filed</TableHead>
              <TableHead>Date of Receiving</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.sr_no}</TableCell>
                <TableCell>{doc.advocate || '-'}</TableCell>
                <TableCell>{doc.filed_by || '-'}</TableCell>
                <TableCell className="font-mono text-sm">{doc.document_no || '-'}</TableCell>
                <TableCell>{doc.document_filed || '-'}</TableCell>
                <TableCell>{formatDate(doc.date_of_receiving)}</TableCell>
                <TableCell>
                  {(doc.pdf_base64 || doc.document_link) ? (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleView(doc)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs gap-1">
                      <FileX className="w-3 h-3" />
                      No PDF Available
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <IframeViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        title={viewerTitle}
        url={viewerUrl}
      />
    </div>
  );
};