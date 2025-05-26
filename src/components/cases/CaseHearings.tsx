
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface CaseHearingsProps {
  caseId: string;
}

export const CaseHearings: React.FC<CaseHearingsProps> = ({ caseId }) => {
  const { data: hearings, isLoading } = useQuery({
    queryKey: ['case-hearings', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hearings')
        .select(`
          *,
          profiles!hearings_created_by_fkey(full_name)
        `)
        .eq('case_id', caseId)
        .order('hearing_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'adjourned':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading hearings...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Hearings</h3>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Hearing
        </Button>
      </div>

      {hearings && hearings.length > 0 ? (
        <div className="space-y-4">
          {hearings.map((hearing) => (
            <div key={hearing.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {hearing.hearing_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(hearing.hearing_date), 'MMM d, yyyy')}
                      </div>
                      {hearing.hearing_time && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {hearing.hearing_time}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {hearing.court_name}
                      </div>
                    </div>
                  </div>
                </div>
                <Badge className={`${getStatusColor(hearing.status)} rounded-full`}>
                  {hearing.status}
                </Badge>
              </div>
              
              {hearing.notes && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{hearing.notes}</p>
                </div>
              )}
              
              {hearing.outcome && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-900">Outcome:</p>
                  <p className="text-sm text-gray-700">{hearing.outcome}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No hearings scheduled yet</p>
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Schedule First Hearing
          </Button>
        </div>
      )}
    </div>
  );
};
