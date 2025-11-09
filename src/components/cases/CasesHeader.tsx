import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Grid3X3, List, Upload, Settings } from 'lucide-react';
import { DeleteAllCasesDialog } from '@/components/admin/DeleteAllCasesDialog';
import { useAuth } from '@/contexts/AuthContext';
interface CasesHeaderProps {
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  onAddCase: () => void;
  onBulkImport: () => void;
  onStandardizeCNR: () => void;
}
export const CasesHeader: React.FC<CasesHeaderProps> = ({
  viewMode,
  onViewModeChange,
  onAddCase,
  onBulkImport,
  onStandardizeCNR
}) => {
  const {
    role
  } = useAuth();
  const isAdmin = role === 'admin';
  return <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Cases</h1>
        
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center border border-gray-200 rounded-lg p-1">
          <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" onClick={() => onViewModeChange('table')} className="h-8 px-3 text-slate-50 bg-slate-900 hover:bg-slate-800">
            <List className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => onViewModeChange('grid')} className="h-8 px-3">
            <Grid3X3 className="w-4 h-4" />
          </Button>
        </div>

        <Button onClick={onBulkImport} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
          <Upload className="w-4 h-4 mr-2" />
          Bulk Import
        </Button>

        {isAdmin}

        <Button onClick={onAddCase} className="bg-slate-800 hover:bg-slate-700">
          <Plus className="w-4 h-4 mr-2" />
          New Case
        </Button>

        {isAdmin && <DeleteAllCasesDialog />}
      </div>
    </div>;
};