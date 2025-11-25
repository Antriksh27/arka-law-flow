import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

interface SCCourtFeesTableProps {
  caseId: string;
}

export const SCCourtFeesTable = ({ caseId }: SCCourtFeesTableProps) => {
  const { data: fees = [], isLoading } = useQuery({
    queryKey: ['sc-court-fees', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sc_court_fees' as any)
        .select('*')
        .eq('case_id', caseId)
        .order('paid_date', { ascending: false });
      if (error) throw error;
      return data as any[];
    }
  });
  
  if (isLoading) return <div className="text-sm text-muted-foreground">Loading court fees...</div>;
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
          {fees.map((fee) => (
            <TableRow key={fee.id}>
              <TableCell>{fee.fee_type || 'N/A'}</TableCell>
              <TableCell className="font-semibold">
                {fee.amount ? `₹${parseFloat(fee.amount).toLocaleString('en-IN')}` : 'N/A'}
              </TableCell>
              <TableCell>
                {fee.paid_date ? format(new Date(fee.paid_date), 'dd MMM yyyy') : 'N/A'}
              </TableCell>
              <TableCell className="font-mono text-sm">{fee.challan_number || 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
