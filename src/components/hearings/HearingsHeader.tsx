import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Plus, Calendar, List, CalendarDays, Clock, ListOrdered, FileText } from 'lucide-react';
import { useDialog } from '@/hooks/use-dialog';
import { CreateHearingDialog } from './CreateHearingDialog';
import { ViewType } from './types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
        <Button variant="outline" onClick={() => navigate('/daily-board')}>
          <ListOrdered className="h-4 w-4 mr-2" />
          Daily Board
        </Button>
        <Button variant="outline" onClick={() => navigate('/stale-cases')}>
          <Clock className="h-4 w-4 mr-2" />
          Stale Cases
        </Button>
        
        
        
        <div className="bg-gray-100 rounded-lg flex p-1">
          <button className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 ${currentView === 'calendar' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`} onClick={() => onViewChange('calendar')}>
            <CalendarDays className="h-4 w-4" />
            <span className="text-sm font-medium">Calendar</span>
          </button>
          <button className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 ${currentView === 'timeline' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`} onClick={() => onViewChange('timeline')}>
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Timeline</span>
          </button>
          
        </div>
      </div>
    </div>;
};