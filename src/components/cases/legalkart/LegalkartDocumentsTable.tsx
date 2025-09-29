import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, AlertCircle } from 'lucide-react';

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

export const LegalkartDocumentsTable: React.FC<LegalkartDocumentsTableProps> = ({ caseId }) => {
  const { data: documents, isLoading } = useQuery<DocumentData[]>({
    queryKey: ['legalkart-documents', caseId],
    queryFn: () => fetchDocuments(caseId),
    enabled: !!caseId
  });

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
                <TableCell>
                  {doc.date_of_receiving 
                    ? new Date(doc.date_of_receiving).toLocaleDateString()
                    : '-'
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};