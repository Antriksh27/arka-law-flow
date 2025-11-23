import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface SCDefectsTableProps {
  caseId: string;
}

export const SCDefectsTable = ({ caseId }: SCDefectsTableProps) => {
  const { data: defects = [], isLoading } = useQuery({
    queryKey: ['sc-defects', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sc_defects' as any)
        .select('*')
        .eq('case_id', caseId)
        .order('notification_date', { ascending: false });
      if (error) throw error;
      return data as any[];
    }
  });
  
  if (isLoading) {
    return <div className="text-muted-foreground">Loading defects...</div>;
  }
  
  const activeDefects = defects.filter(d => !d.removed_on_date);
  const resolvedDefects = defects.filter(d => d.removed_on_date);
  
  return (
    <div className="space-y-6">
      {activeDefects.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-4">Active Defects ({activeDefects.length})</h3>
          {activeDefects.map((defect) => (
            <Card key={defect.id} className="p-4 mb-3 border-l-4 border-l-destructive">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-destructive">{defect.default_type}</div>
                  <div className="text-sm text-muted-foreground mt-1">{defect.remarks}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Notified: {defect.notification_date ? format(new Date(defect.notification_date), 'dd MMM yyyy') : 'N/A'}
                  </div>
                </div>
                <Badge variant="error">Active</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {resolvedDefects.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-muted-foreground mb-4">Resolved Defects ({resolvedDefects.length})</h3>
          {resolvedDefects.map((defect) => (
            <Card key={defect.id} className="p-4 mb-3 border-l-4 border-l-green-500 opacity-70">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium">{defect.default_type}</div>
                  <div className="text-sm text-muted-foreground mt-1">{defect.remarks}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Resolved: {defect.removed_on_date ? format(new Date(defect.removed_on_date), 'dd MMM yyyy') : 'N/A'}
                  </div>
                </div>
                <Badge variant="success">Resolved</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {defects.length === 0 && (
        <div className="text-muted-foreground">No defects recorded</div>
      )}
    </div>
  );
};
