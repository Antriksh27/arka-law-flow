import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface SCEarlierCourtsTableProps {
  caseId: string;
}

export const SCEarlierCourtsTable = ({ caseId }: SCEarlierCourtsTableProps) => {
  const { data: earlierCourts = [], isLoading } = useQuery({
    queryKey: ['sc-earlier-courts', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sc_earlier_court_details' as any)
        .select('*')
        .eq('case_id', caseId)
        .order('sr_no', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!caseId
  });
  
  if (isLoading) {
    return <div className="text-muted-foreground">Loading earlier court details...</div>;
  }
  
  if (earlierCourts.length === 0) {
    return <div className="text-muted-foreground">No earlier court details available</div>;
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground">Earlier Court Details</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>S.No.</TableHead>
            <TableHead>Court Type</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Case No.</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Judge(s)</TableHead>
            <TableHead>Judgment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {earlierCourts.map((court) => (
            <TableRow key={court.id}>
              <TableCell>{court.sr_no}</TableCell>
              <TableCell>{court.court_type}</TableCell>
              <TableCell>{court.agency_state}</TableCell>
              <TableCell className="font-mono text-sm">{court.case_no}</TableCell>
              <TableCell>{court.order_date ? format(new Date(court.order_date), 'dd MMM yyyy') : '-'}</TableCell>
              <TableCell className="max-w-xs truncate" title={court.judge1 || ''}>{court.judge1}</TableCell>
              <TableCell>
                <Badge variant={court.judgment_challenged ? "destructive" : "secondary"}>
                  {court.judgment_challenged ? 'Challenged' : 'Not Challenged'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
