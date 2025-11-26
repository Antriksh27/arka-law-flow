import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { FileText, ExternalLink } from 'lucide-react';

interface OfficeReport {
  id: string;
  serial_number?: string | null;
  process_id?: string | null;
  order_date?: string | null;
  order_url?: string | null;
  receiving_date?: string | null;
}

interface SCOfficeReportsTableProps {
  data: OfficeReport[];
}

export function SCOfficeReportsTable({ data }: SCOfficeReportsTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No office reports available
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">S.No</TableHead>
            <TableHead>Process ID</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Received</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((report) => (
            <TableRow key={report.id}>
              <TableCell>{report.serial_number}</TableCell>
              <TableCell className="font-medium">{report.process_id}</TableCell>
              <TableCell>
                {report.order_date ? format(new Date(report.order_date), 'dd-MM-yyyy') : '-'}
              </TableCell>
              <TableCell className="text-sm">
                {report.receiving_date ? format(new Date(report.receiving_date), 'dd-MM-yyyy HH:mm') : '-'}
              </TableCell>
              <TableCell className="text-right">
                {report.order_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(report.order_url!, '_blank')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View
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