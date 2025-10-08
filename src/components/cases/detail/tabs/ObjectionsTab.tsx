import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

interface ObjectionsTabProps {
  caseId: string;
  legalkartData: any;
}

export const ObjectionsTab: React.FC<ObjectionsTabProps> = ({ caseId, legalkartData }) => {
  const { data: objections, isLoading } = useQuery({
    queryKey: ['case-objections', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legalkart_objections' as any)
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching objections:', error);
        return [];
      }
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading objections...</p>
      </div>
    );
  }

  // Check for objection data in legalkart_data or the objections table
  const hasObjections = (objections && objections.length > 0) || legalkartData?.objection;

  if (!hasObjections) {
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No objections found for this case</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Objection from legalkart_cases if available */}
      {legalkartData?.objection && (
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-gray-900">Objection Noted</h4>
                {legalkartData?.objection_status && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    {legalkartData.objection_status}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-700">{legalkartData.objection}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Objections from legalkart_objections table */}
      {objections && objections.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Objection History</h3>
          <div className="space-y-4">
            {objections.map((obj: any) => (
              <div key={obj.id} className="pb-4 border-b border-gray-100 last:border-0">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-orange-500 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">{obj.objection_title || 'Objection'}</p>
                      {obj.status && (
                        <Badge variant="outline" className="text-xs">
                          {obj.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{obj.objection_description || obj.remarks}</p>
                    {obj.compliance_status && (
                      <p className="text-xs text-gray-500">
                        Compliance: {obj.compliance_status}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
