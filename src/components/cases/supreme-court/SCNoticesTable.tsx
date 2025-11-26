import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

interface Notice {
  id: string;
  sr_no?: string | null;
  process_id?: string | null;
  notice_type?: string | null;
  name?: string | null;
  state?: string | null;
  district?: string | null;
  issue_date?: string | null;
  returnable_date?: string | null;
}

interface SCNoticesTableProps {
  data: Notice[];
}

export function SCNoticesTable({ data }: SCNoticesTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No notices available
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
            <TableHead>Notice Type</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>State/District</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Returnable Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((notice) => (
            <TableRow key={notice.id}>
              <TableCell>{notice.sr_no}</TableCell>
              <TableCell className="font-medium">{notice.process_id}</TableCell>
              <TableCell>{notice.notice_type}</TableCell>
              <TableCell className="text-sm">{notice.name}</TableCell>
              <TableCell className="text-sm">{notice.state && notice.district ? `${notice.state} / ${notice.district}` : (notice.state || notice.district || '-')}</TableCell>
              <TableCell>
                {notice.issue_date ? format(new Date(notice.issue_date), 'dd-MM-yyyy') : '-'}
              </TableCell>
              <TableCell>
                {notice.returnable_date ? format(new Date(notice.returnable_date), 'dd-MM-yyyy') : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}