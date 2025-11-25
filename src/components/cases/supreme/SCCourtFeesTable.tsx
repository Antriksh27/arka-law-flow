import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';

interface SCCourtFeesTableProps {
  caseId: string;
  data?: any[];
}

export const SCCourtFeesTable = ({ caseId, data: propData }: SCCourtFeesTableProps) => {
  const { data: dbData = [], isLoading } = useQuery({
    queryKey: ['sc-court-fees', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sc_court_fees' as any)
        .select('*')
        .eq('case_id', caseId)
        .order('paid_date', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!caseId && !propData
  });
  
  const fees = propData || dbData;
  
  if (isLoading && !propData) return <div className="text-sm text-muted-foreground">Loading court fees...</div>;
  if (fees.length === 0) return <div className="text-sm text-muted-foreground">No court fees recorded</div>;
  
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fee Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Paid Date</TableHead>
            <TableHead>Challan Number</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fees.map((fee, idx) => (
            <TableRow key={fee.id || idx}>
              <TableCell>{fee.fee_type || fee['Fee Type'] || 'N/A'}</TableCell>
              <TableCell className="font-semibold">
                {fee.amount || fee['Amount']
                  ? `₹${parseFloat(fee.amount || fee['Amount']).toLocaleString('en-IN')}`
                  : 'N/A'}
              </TableCell>
              <TableCell>
                {fee.paid_date || fee['Paid Date']
                  ? format(parseISO(fee.paid_date || fee['Paid Date']), 'dd MMM yyyy')
                  : 'N/A'}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {fee.challan_number || fee['Challan Number'] || 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
