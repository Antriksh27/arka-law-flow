import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Plus, Calendar, List, CalendarDays, Clock } from 'lucide-react';
import { useDialog } from '@/hooks/use-dialog';
import { CreateHearingDialog } from './CreateHearingDialog';
import { ViewType } from './types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
interface HearingsHeaderProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}
export const HearingsHeader: React.FC<HearingsHeaderProps> = ({
  currentView,
  onViewChange
}) => {
  const {
    openDialog
  } = useDialog();
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const bulkUpdateTimeMutation = useMutation({
    mutationFn: async () => {
      const {
        data,
        error
      } = await supabase.from('hearings').update({
        hearing_time: '12:00:00'
      }).eq('hearing_time', '05:30:00').select();
      if (error) throw error;
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: ['hearings']
      });
      toast({
        title: "Success",
        description: `Updated ${data?.length || 0} hearing(s) to 12:00 PM`
      });
      setIsUpdating(false);
    },
    onError: error => {
      console.error('Error updating hearings:', error);
      toast({
        title: "Error",
        description: "Failed to update hearing times",
        variant: "destructive"
      });
      setIsUpdating(false);
    }
  });
  const handleBulkUpdate = () => {
    setIsUpdating(true);
    bulkUpdateTimeMutation.mutate();
  };
  return <div className="flex w-full flex-col items-start gap-4">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-2xl font-semibold text-gray-900">
            Hearings
          </span>
          <span className="text-base text-gray-600">
            Track all your firm's court hearings
          </span>
        </div>
        
      </div>
      <div className="flex w-full flex-wrap items-center gap-4 justify-end">
        
        <div className="bg-gray-100 rounded-lg flex p-1">
          <button className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 ${currentView === 'calendar' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`} onClick={() => onViewChange('calendar')}>
            <CalendarDays className="h-4 w-4" />
            <span className="text-sm font-medium">Calendar</span>
          </button>
          <button className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 ${currentView === 'timeline' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`} onClick={() => onViewChange('timeline')}>
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Timeline</span>
          </button>
          <button className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 ${currentView === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`} onClick={() => onViewChange('table')}>
            <List className="h-4 w-4" />
            <span className="text-sm font-medium">Table</span>
          </button>
        </div>
      </div>
    </div>;
};