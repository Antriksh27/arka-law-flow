import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SCTaggedMattersTableProps {
  caseId: string;
  data?: any[];
}

export const SCTaggedMattersTable = ({ caseId, data: propData }: SCTaggedMattersTableProps) => {
  const { data: dbData = [], isLoading } = useQuery({
    queryKey: ['sc-tagged-matters', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sc_tagged_matters' as any)
        .select('*')
        .eq('case_id', caseId)
        .order('entry_date', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!caseId && !propData
  });
  
  const taggedMatters = propData || dbData;
  
  if (isLoading && !propData) {
    return <div className="text-muted-foreground">Loading tagged matters...</div>;
  }
  
  if (taggedMatters.length === 0) {
    return <div className="text-muted-foreground">No tagged matters available</div>;
  }
  
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {taggedMatters.map((tm, idx) => (
          <Card key={tm.id || idx} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-mono text-sm text-muted-foreground">
                  {tm.tagged_case_number || tm['Tagged Case Number'] || 'N/A'}
                </div>
                <div className="font-medium mt-1">
                  {tm.petitioner_vs_respondent || tm['Petitioner Vs Respondent'] || 'N/A'}
                </div>
                {(tm.ia_info || tm['IA Information']) && (
                  <div className="text-xs text-muted-foreground mt-1">
                    IA: {tm.ia_info || tm['IA Information']}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Badge variant={(tm.list_status || tm['List Status']) === 'Y' ? 'default' : 'outline'}>
                  {(tm.list_status || tm['List Status']) === 'Y' ? 'Listed' : 'Not Listed'}
                </Badge>
                <Badge variant={(tm.matter_status || tm['Matter Status']) === 'P' ? 'warning' : 'outline'}>
                  {(tm.matter_status || tm['Matter Status']) === 'P' ? 'Pending' : 'Disposed'}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
