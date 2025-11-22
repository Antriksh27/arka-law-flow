import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface SCJudgementOrdersTableProps {
  caseId: string;
}

export const SCJudgementOrdersTable = ({ caseId }: SCJudgementOrdersTableProps) => {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['sc-judgement-orders', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sc_judgement_orders' as any)
        .select('*')
        .eq('case_id', caseId)
        .order('order_date', { ascending: false });
      if (error) throw error;
      return data as any[];
    }
  });
  
  if (isLoading) {
    return <div className="text-muted-foreground">Loading SC orders...</div>;
  }
  
  if (orders.length === 0) {
    return <div className="text-muted-foreground">No Supreme Court orders available</div>;
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground">Supreme Court Orders ({orders.length})</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Document</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">
                {order.order_date ? format(new Date(order.order_date), 'dd MMM yyyy') : 'N/A'}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{order.order_type}</Badge>
              </TableCell>
              <TableCell>
                {order.pdf_url ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(order.pdf_url!, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Download PDF
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                ) : (
                  <span className="text-muted-foreground">No document</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
