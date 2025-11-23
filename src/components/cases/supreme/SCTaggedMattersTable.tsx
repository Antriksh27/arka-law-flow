import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SCTaggedMattersTableProps {
  caseId: string;
}

export const SCTaggedMattersTable = ({ caseId }: SCTaggedMattersTableProps) => {
  const { data: taggedMatters = [], isLoading } = useQuery({
    queryKey: ['sc-tagged-matters', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sc_tagged_matters' as any)
        .select('*')
        .eq('case_id', caseId)
        .order('entry_date', { ascending: false });
      if (error) throw error;
      return data as any[];
    }
  });
  
  if (isLoading) {
    return <div className="text-muted-foreground">Loading tagged matters...</div>;
  }
  
  if (taggedMatters.length === 0) {
    return <div className="text-muted-foreground">No tagged matters available</div>;
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground">Tagged/Related Matters</h3>
      <div className="space-y-3">
        {taggedMatters.map((tm) => (
          <Card key={tm.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-mono text-sm text-muted-foreground">{tm.tagged_case_number}</div>
                <div className="font-medium mt-1">{tm.petitioner_vs_respondent}</div>
                {tm.ia_info && <div className="text-xs text-muted-foreground mt-1">IA: {tm.ia_info}</div>}
              </div>
              <div className="flex gap-2">
                <Badge variant={tm.list_status === 'Y' ? 'active' : 'outline'}>
                  {tm.list_status === 'Y' ? 'Listed' : 'Not Listed'}
                </Badge>
                <Badge variant={tm.matter_status === 'P' ? 'warning' : 'disposed'}>
                  {tm.matter_status === 'P' ? 'Pending' : 'Disposed'}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
