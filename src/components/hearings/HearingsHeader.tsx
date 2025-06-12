
import React from 'react';
import { Button } from '../ui/button';
import { Plus, Calendar, List } from 'lucide-react';
import { useDialog } from '@/hooks/use-dialog';
import { CreateHearingDialog } from './CreateHearingDialog';
import { ViewType } from './types';

interface HearingsHeaderProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export const HearingsHeader: React.FC<HearingsHeaderProps> = ({ 
  currentView,
  onViewChange
}) => {
  const { openDialog } = useDialog();

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Hearings</h1>
        <p className="text-gray-600 mt-1">
          Manage all court hearings for your cases
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="bg-gray-100 rounded-lg flex p-1">
          <button
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 ${
              currentView === 'timeline' 
                ? 'bg-white shadow-sm text-primary' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => onViewChange('timeline')}
          >
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Timeline</span>
          </button>
          <button
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 ${
              currentView === 'table' 
                ? 'bg-white shadow-sm text-primary' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => onViewChange('table')}
          >
            <List className="h-4 w-4" />
            <span className="text-sm font-medium">Table</span>
          </button>
        </div>

        <Button 
          className="bg-blue-700 hover:bg-blue-800"
          onClick={() => openDialog(<CreateHearingDialog />)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Hearing
        </Button>
      </div>
    </div>
  );
};
