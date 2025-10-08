import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface HearingsTabProps {
  caseId: string;
}

export const HearingsTab: React.FC<HearingsTabProps> = ({ caseId }) => {
  const { data: hearings, isLoading } = useQuery({
    queryKey: ['case-hearings', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legalkart_history' as any)
        .select('*')
        .eq('case_id', caseId)
        .order('hearing_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching hearings:', error);
        return [];
      }
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading hearings...</p>
      </div>
    );
  }

  if (!hearings || hearings.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No hearing history found for this case</p>
      </Card>
    );
  }

  // Find next upcoming hearing
  const now = new Date();
  let upcomingDate: string | null = null;
  if (Array.isArray(hearings)) {
    const upcomingHearing: any = hearings.find((h: any) => 
      h.hearing_date && new Date(h.hearing_date) > now
    );
    if (upcomingHearing) {
      upcomingDate = upcomingHearing.hearing_date;
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {Array.isArray(hearings) && hearings.map((hearing: any, idx: number) => {
          const isUpcoming = upcomingDate && hearing.hearing_date === upcomingDate;
          const hearingDate = hearing.hearing_date ? new Date(hearing.hearing_date) : null;

          return (
            <div
              key={idx}
              className={`p-4 rounded-lg border-2 ${
                isUpcoming 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Calendar className={`w-5 h-5 ${isUpcoming ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {hearingDate ? format(hearingDate, 'dd MMMM yyyy') : 'Date not specified'}
                    </p>
                    <p className="text-sm text-gray-500">{hearing.purpose || 'Hearing'}</p>
                  </div>
                </div>
                {isUpcoming && (
                  <Badge className="bg-blue-600 text-white">
                    Next Hearing
                  </Badge>
                )}
              </div>

              {hearing.stage && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500">Stage:</p>
                  <p className="text-sm font-medium text-gray-700">{hearing.stage}</p>
                </div>
              )}

              {hearing.remarks && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500">Remarks:</p>
                  <p className="text-sm text-gray-700">{hearing.remarks}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
