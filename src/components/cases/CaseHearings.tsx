import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Clock, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Hearing } from '../hearings/types';
import { getHearingStatusBadge } from '../hearings/utils';
import { useDialog } from '@/hooks/use-dialog';
import { CreateHearingDialogWrapper } from './CreateHearingDialogWrapper';
import { EditHearingDialog } from '../hearings/EditHearingDialog';
interface CaseHearingsProps {
  caseId: string;
}
export const CaseHearings: React.FC<CaseHearingsProps> = ({
  caseId
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const {
    openDialog
  } = useDialog();
  const {
    data: hearings,
    isLoading
  } = useQuery({
    queryKey: ['case-hearings', caseId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('hearings').select(`
          *,
          profiles!hearings_created_by_fkey(full_name)
        `).eq('case_id', caseId).order('hearing_date', {
        ascending: true
      });
      if (error) throw error;
      return data || [];
    }
  });

  // Function to format the hearing type string
  const formatHearingType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  if (isLoading) {
    return <div className="text-center py-8">Loading hearings...</div>;
  }
  return <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Hearings</h3>
        <Button 
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Hearing
        </Button>
      </div>

      {hearings && hearings.length > 0 ? <div className="space-y-4">
          {hearings.map(hearing => <div key={hearing.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {formatHearingType(hearing.hearing_type)}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-muted mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(parseISO(hearing.hearing_date), 'MMM d, yyyy')}
                      </div>
                      {hearing.hearing_time && <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {hearing.hearing_time}
                        </div>}
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {hearing.court_name}
                      </div>
                    </div>
                  </div>
                </div>
                {getHearingStatusBadge(hearing.status as any)}
              </div>
              
              {hearing.notes && <div className="mt-3 p-3 bg-soft rounded-lg">
                  <p className="text-sm">{hearing.notes}</p>
                </div>}
              
              {hearing.outcome && <div className="mt-3">
                  <p className="text-sm font-medium">Outcome:</p>
                  <p className="text-sm">{hearing.outcome}</p>
                </div>}

              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => {
            const editDialog = <EditHearingDialog hearingId={hearing.id} />;
            openDialog(editDialog);
          }}>
                  Edit
                </Button>
              </div>
            </div>)}
        </div> : <div className="text-center py-12 text-muted">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-muted" />
          <p>No hearings scheduled yet</p>
          <Button 
            onClick={() => setShowCreateDialog(true)} 
            className="mt-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule First Hearing
          </Button>
        </div>}
      <CreateHearingDialogWrapper 
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        caseId={caseId}
      />
    </div>;
};