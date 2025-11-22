import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface SCNoticesTableProps {
  caseId: string;
}

export const SCNoticesTable = ({ caseId }: SCNoticesTableProps) => {
  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['sc-notices', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sc_notices' as any)
        .select('*')
        .eq('case_id', caseId)
        .order('issue_date', { ascending: false });
      if (error) throw error;
      return data as any[];
    }
  });
  
  if (isLoading) {
    return <div className="text-muted-foreground">Loading notices...</div>;
  }
  
  if (notices.length === 0) {
    return <div className="text-muted-foreground">No notices available</div>;
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground">Notices</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Process ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Returnable</TableHead>
            <TableHead>Dispatched</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notices.map((notice) => (
            <TableRow key={notice.id}>
              <TableCell className="font-mono text-xs">{notice.process_id}</TableCell>
              <TableCell><Badge variant="outline">{notice.notice_type}</Badge></TableCell>
              <TableCell className="max-w-xs truncate">{notice.name}</TableCell>
              <TableCell>{notice.state}, {notice.district}</TableCell>
              <TableCell>{notice.issue_date ? format(new Date(notice.issue_date), 'dd MMM yyyy') : '-'}</TableCell>
              <TableCell>{notice.returnable_date ? format(new Date(notice.returnable_date), 'dd MMM yyyy') : '-'}</TableCell>
              <TableCell>
                {notice.dispatch_date ? (
                  <Badge variant="default">Dispatched</Badge>
                ) : (
                  <Badge variant="secondary">Pending</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
