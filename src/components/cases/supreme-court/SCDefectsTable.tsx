import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Defect {
  id: string;
  sr_no?: string | null;
  default_type?: string | null;
  remarks?: string | null;
  notification_date?: string | null;
  removed_on_date?: string | null;
}

interface SCDefectsTableProps {
  data: Defect[];
}

export function SCDefectsTable({ data }: SCDefectsTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No defects recorded
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">S.No</TableHead>
            <TableHead>Defect</TableHead>
            <TableHead>Remarks</TableHead>
            <TableHead>Notified</TableHead>
            <TableHead>Removed</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((defect) => (
            <TableRow key={defect.id}>
              <TableCell>{defect.sr_no}</TableCell>
              <TableCell className="font-medium">{defect.default_type}</TableCell>
              <TableCell className="text-sm">{defect.remarks}</TableCell>
              <TableCell>
                {defect.notification_date ? format(new Date(defect.notification_date), 'dd-MM-yyyy') : '-'}
              </TableCell>
              <TableCell>
                {defect.removed_on_date ? format(new Date(defect.removed_on_date), 'dd-MM-yyyy') : '-'}
              </TableCell>
              <TableCell>
                {defect.removed_on_date ? (
                  <Badge variant="success">Resolved</Badge>
                ) : (
                  <Badge variant="error">Pending</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}