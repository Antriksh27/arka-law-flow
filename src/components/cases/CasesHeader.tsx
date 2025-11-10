import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Grid3X3, List, Upload, Settings, Link2 } from 'lucide-react';
import { DeleteAllCasesDialog } from '@/components/admin/DeleteAllCasesDialog';
import { useAuth } from '@/contexts/AuthContext';
interface CasesHeaderProps {
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  onAddCase: () => void;
  onBulkImport: () => void;
  onBulkImportDisposed?: () => void;
  onStandardizeCNR: () => void;
  onLinkClients: () => void;
}
export const CasesHeader: React.FC<CasesHeaderProps> = ({
  viewMode,
  onViewModeChange,
  onAddCase,
  onBulkImport,
  onBulkImportDisposed,
  onStandardizeCNR,
  onLinkClients
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewModeChange(viewMode === 'grid' ? 'table' : 'grid')}
        >
          {viewMode === 'grid' ? (
            <>
              <List className="w-4 h-4 mr-2" />
              Table View
            </>
          ) : (
            <>
              <Grid3X3 className="w-4 h-4 mr-2" />
              Grid View
            </>
          )}
        </Button>

        <Button variant="outline" size="sm" onClick={onBulkImport}>
          <Upload className="w-4 h-4 mr-2" />
          Bulk Import
        </Button>

        {onBulkImportDisposed && (
          <Button variant="outline" size="sm" onClick={onBulkImportDisposed}>
            <Upload className="w-4 h-4 mr-2" />
            Import Disposed
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={onStandardizeCNR}>
          <Settings className="w-4 h-4 mr-2" />
          Standardize CNR
        </Button>

        <Button variant="outline" size="sm" onClick={onLinkClients}>
          <Link2 className="w-4 h-4 mr-2" />
          Link Clients
        </Button>

        {isAdmin && (
          <Button onClick={onAddCase} className="bg-slate-800 hover:bg-slate-700">
            <Plus className="w-4 h-4 mr-2" />
            New Case
          </Button>
        )}

        {isAdmin && <DeleteAllCasesDialog />}
      </div>
    </div>;
};