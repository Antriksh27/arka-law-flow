import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { FileText, ExternalLink } from 'lucide-react';

interface JudgementOrder {
  id: string;
  order_date?: string | null;
  pdf_url?: string | null;
  order_type?: string | null;
}

interface SCJudgementOrdersTableProps {
  data: JudgementOrder[];
}

export function SCJudgementOrdersTable({ data }: SCJudgementOrdersTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No orders available
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order Date</TableHead>
            <TableHead>Order Type</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">
                {order.order_date ? format(new Date(order.order_date), 'dd MMM yyyy') : '-'}
              </TableCell>
              <TableCell className="text-sm">{order.order_type || 'Order'}</TableCell>
              <TableCell className="text-right">
                {order.pdf_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(order.pdf_url!, '_blank')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View PDF
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}