import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface EarlierCourtDetail {
  id: string;
  serial_no?: string | null;
  court?: string | null;
  agency_state?: string | null;
  case_no?: string | null;
  order_date?: string | null;
  judge1?: string | null;
  judgment_challenged?: boolean | null;
  judgment_type?: string | null;
}

interface SCEarlierCourtsTableProps {
  data: EarlierCourtDetail[];
}

export function SCEarlierCourtsTable({ data }: SCEarlierCourtsTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No earlier court details available
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">S.No</TableHead>
            <TableHead>Court</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Case No</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Judge</TableHead>
            <TableHead>Judgment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((court) => (
            <TableRow key={court.id}>
              <TableCell>{court.serial_no}</TableCell>
              <TableCell className="font-medium">{court.court}</TableCell>
              <TableCell>{court.agency_state}</TableCell>
              <TableCell>{court.case_no}</TableCell>
              <TableCell>
                {court.order_date ? format(new Date(court.order_date), 'dd-MM-yyyy') : '-'}
              </TableCell>
              <TableCell className="text-sm">{court.judge1 || '-'}</TableCell>
              <TableCell>
                {court.judgment_challenged && (
                  <Badge variant={court.judgment_type === 'Final' ? 'default' : 'outline'}>
                    {court.judgment_type || 'Challenged'}
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}