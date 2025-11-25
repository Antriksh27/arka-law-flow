import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

interface SCEarlierCourtsTableProps {
  caseId: string;
  data?: any[];
}

export const SCEarlierCourtsTable = ({ caseId, data: propData }: SCEarlierCourtsTableProps) => {
  const { data: dbData = [], isLoading } = useQuery({
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
    enabled: !!caseId && !propData
  });
  
  // Use prop data if provided, otherwise use DB data
  const earlierCourts = propData || dbData;
  
  if (isLoading && !propData) {
    return <div className="text-muted-foreground">Loading earlier court details...</div>;
  }
  
  if (earlierCourts.length === 0) {
    return <div className="text-muted-foreground">No earlier court details available</div>;
  }
  
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>S.No.</TableHead>
            <TableHead>Court Type</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Case No.</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Judge(s)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {earlierCourts.map((court, idx) => (
            <TableRow key={court.id || idx}>
              <TableCell>{court.sr_no || court['S. No.'] || idx + 1}</TableCell>
              <TableCell>{court.court_type || court['Court Type'] || '-'}</TableCell>
              <TableCell>{court.agency_state || court['Agency/State'] || '-'}</TableCell>
              <TableCell className="font-mono text-sm">{court.case_no || court['Case No.'] || '-'}</TableCell>
              <TableCell>
                {court.order_date || court['Order Date'] 
                  ? format(parseISO(court.order_date || court['Order Date']), 'dd MMM yyyy')
                  : '-'}
              </TableCell>
              <TableCell className="max-w-xs truncate" title={court.judge1 || court['Judge1'] || ''}>
                {court.judge1 || court['Judge1'] || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
