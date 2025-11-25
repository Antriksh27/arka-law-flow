import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

interface SCDefectsTableProps {
  caseId: string;
  data?: any[];
}

export const SCDefectsTable = ({ caseId, data: propData }: SCDefectsTableProps) => {
  const { data: dbData = [], isLoading } = useQuery({
    queryKey: ['sc-defects', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sc_defects' as any)
        .select('*')
        .eq('case_id', caseId)
        .order('notification_date', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!caseId && !propData
  });
  
  const defects = propData || dbData;
  
  if (isLoading && !propData) {
    return <div className="text-muted-foreground">Loading defects...</div>;
  }
  
  const activeDefects = defects.filter(d => !(d.removed_on_date || d['Removed on Date']));
  const resolvedDefects = defects.filter(d => d.removed_on_date || d['Removed on Date']);
  
  return (
    <div className="space-y-6">
      {activeDefects.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-4">Active Defects ({activeDefects.length})</h3>
          {activeDefects.map((defect, idx) => (
            <Card key={defect.id || idx} className="p-4 mb-3 border-l-4 border-l-destructive">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-destructive">
                    {defect.default_type || defect['Default Type'] || 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {defect.remarks || defect['Remarks'] || 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Notified: {defect.notification_date || defect['Notification Date']
                      ? format(parseISO(defect.notification_date || defect['Notification Date']), 'dd MMM yyyy')
                      : 'N/A'}
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
          {resolvedDefects.map((defect, idx) => (
            <Card key={defect.id || idx} className="p-4 mb-3 border-l-4 border-l-green-500 opacity-70">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium">
                    {defect.default_type || defect['Default Type'] || 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {defect.remarks || defect['Remarks'] || 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Resolved: {defect.removed_on_date || defect['Removed on Date']
                      ? format(parseISO(defect.removed_on_date || defect['Removed on Date']), 'dd MMM yyyy')
                      : 'N/A'}
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
