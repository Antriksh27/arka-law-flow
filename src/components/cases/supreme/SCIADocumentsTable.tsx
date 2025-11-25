import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface SCIADocumentsTableProps {
  caseId: string;
  data?: any[];
}

export const SCIADocumentsTable = ({ caseId, data: propData }: SCIADocumentsTableProps) => {
  const { data: dbData = [], isLoading } = useQuery({
    queryKey: ['sc-ia-documents', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sc_ia_documents' as any)
        .select('*')
        .eq('case_id', caseId)
        .order('filing_date', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!caseId && !propData
  });
  
  const iaDocuments = propData || dbData;
  
  if (isLoading && !propData) return <div className="text-sm text-muted-foreground">Loading IA documents...</div>;
  if (iaDocuments.length === 0) return <div className="text-sm text-muted-foreground">No IA documents available</div>;
  
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>IA Number</TableHead>
            <TableHead>Document Type</TableHead>
            <TableHead>Filed By</TableHead>
            <TableHead>Filing Date</TableHead>
            <TableHead>Document</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {iaDocuments.map((ia, idx) => (
            <TableRow key={ia.id || idx}>
              <TableCell className="font-mono text-sm">
                {ia.ia_number || ia['IA Number'] || 'N/A'}
              </TableCell>
              <TableCell>{ia.document_type || ia['Document Type'] || 'N/A'}</TableCell>
              <TableCell>{ia.filed_by || ia['Filed By'] || 'N/A'}</TableCell>
              <TableCell>
                {ia.filing_date || ia['Filing Date']
                  ? format(parseISO(ia.filing_date || ia['Filing Date']), 'dd MMM yyyy')
                  : 'N/A'}
              </TableCell>
              <TableCell>
                {(ia.document_url || ia['Document URL']) ? (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={ia.document_url || ia['Document URL']} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">N/A</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
