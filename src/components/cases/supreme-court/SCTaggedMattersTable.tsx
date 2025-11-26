import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface TaggedMatter {
  id: string;
  matter_type?: string | null;
  tagged_case_number?: string | null;
  petitioner_vs_respondent?: string | null;
  matter_status?: string | null;
  ia_info?: string | null;
  entry_date?: string | null;
}

interface SCTaggedMattersTableProps {
  data: TaggedMatter[];
}

export function SCTaggedMattersTable({ data }: SCTaggedMattersTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tagged matters available
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Type</TableHead>
            <TableHead>Case Number</TableHead>
            <TableHead>Parties</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>IA</TableHead>
            <TableHead>Entry Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((matter) => (
            <TableRow key={matter.id}>
              <TableCell>
                <Badge variant="outline">{matter.matter_type}</Badge>
              </TableCell>
              <TableCell className="font-medium">{matter.tagged_case_number}</TableCell>
              <TableCell className="text-sm">{matter.petitioner_vs_respondent}</TableCell>
              <TableCell>
                <Badge variant={matter.matter_status === 'P' ? 'default' : 'outline'}>
                  {matter.matter_status === 'P' ? 'Pending' : matter.matter_status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{matter.ia_info || '-'}</TableCell>
              <TableCell>
                {matter.entry_date ? format(new Date(matter.entry_date), 'dd-MM-yyyy') : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}