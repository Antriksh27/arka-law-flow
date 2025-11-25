import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface SCJudgementOrdersTableProps {
  caseId: string;
  data?: any[];
}

export const SCJudgementOrdersTable = ({ caseId, data: propData }: SCJudgementOrdersTableProps) => {
  const { data: dbData = [], isLoading } = useQuery({
    queryKey: ['sc-judgement-orders', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sc_judgement_orders' as any)
        .select('*')
        .eq('case_id', caseId)
        .order('order_date', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!caseId && !propData
  });
  
  const orders = propData || dbData;
  
  if (isLoading && !propData) {
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
          {orders.map((order, idx) => (
            <TableRow key={order.id || idx}>
              <TableCell className="font-medium">
                {order.order_date || order['Order Date']
                  ? format(parseISO(order.order_date || order['Order Date']), 'dd MMM yyyy')
                  : 'N/A'}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{order.order_type || order['Order Type'] || 'N/A'}</Badge>
              </TableCell>
              <TableCell>
                {(order.pdf_url || order['PDF Url']) ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(order.pdf_url || order['PDF Url'], '_blank')}
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
