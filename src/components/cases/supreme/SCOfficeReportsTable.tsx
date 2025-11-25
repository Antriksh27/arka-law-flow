import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface SCOfficeReportsTableProps {
  caseId: string;
  data?: any[];
}

export const SCOfficeReportsTable = ({ caseId, data: propData }: SCOfficeReportsTableProps) => {
  const { data: dbData = [], isLoading } = useQuery({
    queryKey: ['sc-office-reports', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sc_office_reports' as any)
        .select('*')
        .eq('case_id', caseId)
        .order('order_date', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!caseId && !propData
  });
  
  const reports = propData || dbData;
  
  if (isLoading && !propData) {
    return <div className="text-muted-foreground">Loading office reports...</div>;
  }
  
  if (reports.length === 0) {
    return <div className="text-muted-foreground">No office reports available</div>;
  }
  
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Process ID</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Report</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report, idx) => (
            <TableRow key={report.id || idx}>
              <TableCell className="font-mono text-xs">
                {report.process_id || report['Process ID'] || 'N/A'}
              </TableCell>
              <TableCell>
                {report.order_date || report['Order Date']
                  ? format(parseISO(report.order_date || report['Order Date']), 'dd MMM yyyy')
                  : '-'}
              </TableCell>
              <TableCell>
                {(report.html_url || report['HTML Url']) ? (
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => window.open(report.html_url || report['HTML Url'], '_blank')}
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
