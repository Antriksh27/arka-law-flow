
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Grid3X3, List } from 'lucide-react';

interface CasesHeaderProps {
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  onAddCase: () => void;
}

export const CasesHeader: React.FC<CasesHeaderProps> = ({
  viewMode,
  onViewModeChange,
  onAddCase
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Cases</h1>
        <p className="text-gray-600 mt-1">Manage all your legal cases</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center border border-gray-200 rounded-lg p-1">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('table')}
            className="h-8 px-3"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="h-8 px-3"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
        </div>

        <Button onClick={onAddCase} className="bg-slate-800 hover:bg-slate-700">
          <Plus className="w-4 h-4 mr-2" />
          New Case
        </Button>
      </div>
    </div>
  );
};
