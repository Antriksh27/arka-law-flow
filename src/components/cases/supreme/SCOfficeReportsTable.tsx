import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface SCOfficeReportsTableProps {
  caseId: string;
}

export const SCOfficeReportsTable = ({ caseId }: SCOfficeReportsTableProps) => {
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['sc-office-reports', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sc_office_reports' as any)
        .select('*')
        .eq('case_id', caseId)
        .order('order_date', { ascending: false });
      if (error) throw error;
      return data as any[];
    }
  });
  
  if (isLoading) {
    return <div className="text-muted-foreground">Loading office reports...</div>;
  }
  
  if (reports.length === 0) {
    return <div className="text-muted-foreground">No office reports available</div>;
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground">Office Reports</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Process ID</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Receiving Date</TableHead>
            <TableHead>Report</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell className="font-mono text-xs">{report.process_id}</TableCell>
              <TableCell>
                {report.order_date ? format(new Date(report.order_date), 'dd MMM yyyy') : '-'}
              </TableCell>
              <TableCell className="text-xs">
                {report.receiving_date ? format(new Date(report.receiving_date), 'dd MMM yyyy HH:mm') : '-'}
              </TableCell>
              <TableCell>
                {report.html_url ? (
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => window.open(report.html_url!, '_blank')}
                    className="flex items-center gap-1"
                  >
                    View Report <ExternalLink className="w-3 h-3" />
                  </Button>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
