import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

interface SCNoticesTableProps {
  caseId: string;
  data?: any[];
}

export const SCNoticesTable = ({ caseId, data: propData }: SCNoticesTableProps) => {
  const { data: dbData = [], isLoading } = useQuery({
    queryKey: ['sc-notices', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sc_notices' as any)
        .select('*')
        .eq('case_id', caseId)
        .order('issue_date', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!caseId && !propData
  });
  
  const notices = propData || dbData;
  
  if (isLoading && !propData) {
    return <div className="text-muted-foreground">Loading notices...</div>;
  }
  
  if (notices.length === 0) {
    return <div className="text-muted-foreground">No notices available</div>;
  }
  
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Process ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Issue Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notices.map((notice, idx) => (
            <TableRow key={notice.id || idx}>
              <TableCell className="font-mono text-xs">
                {notice.process_id || notice['Process ID'] || 'N/A'}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {notice.notice_type || notice['Type'] || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {notice.name || notice['Name'] || 'N/A'}
              </TableCell>
              <TableCell>
                {(notice.state || notice['State']) && (notice.district || notice['District'])
                  ? `${notice.state || notice['State']}, ${notice.district || notice['District']}`
                  : notice.state || notice['State'] || notice.district || notice['District'] || 'N/A'}
              </TableCell>
              <TableCell>
                {notice.issue_date || notice['Issue Date']
                  ? format(parseISO(notice.issue_date || notice['Issue Date']), 'dd MMM yyyy')
                  : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
