import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface SCIADocumentsTableProps {
  caseId: string;
}

export const SCIADocumentsTable = ({ caseId }: SCIADocumentsTableProps) => {
  const { data: iaDocuments = [], isLoading } = useQuery({
    queryKey: ['sc-ia-documents', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sc_ia_documents' as any)
        .select('*')
        .eq('case_id', caseId)
        .order('filing_date', { ascending: false });
      if (error) throw error;
      return data as any[];
    }
  });
  
  if (isLoading) return <div className="text-sm text-muted-foreground">Loading IA documents...</div>;
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
            <TableHead>Status</TableHead>
            <TableHead>Document</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {iaDocuments.map((ia) => (
            <TableRow key={ia.id}>
              <TableCell className="font-mono text-sm">{ia.ia_number || 'N/A'}</TableCell>
              <TableCell>{ia.document_type || 'N/A'}</TableCell>
              <TableCell>{ia.filed_by || 'N/A'}</TableCell>
              <TableCell>
                {ia.filing_date ? format(new Date(ia.filing_date), 'dd MMM yyyy') : 'N/A'}
              </TableCell>
              <TableCell>
                <Badge variant={ia.status === 'Filed' ? 'default' : 'outline'}>
                  {ia.status || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell>
                {ia.document_url ? (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={ia.document_url} target="_blank" rel="noopener noreferrer">
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
