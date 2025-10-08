
import React, { useState } from 'react';
import { CasesHeader } from '../components/cases/CasesHeader';
import { CasesFilters } from '../components/cases/CasesFilters';
import { CasesGrid } from '../components/cases/CasesGrid';
import { CasesTable } from '../components/cases/CasesTable';
import { CasesMetrics } from '../components/cases/dashboard/CasesMetrics';
import { AddCaseDialog } from '../components/cases/AddCaseDialog';
import { BulkImportCasesDialog } from '../components/cases/BulkImportCasesDialog';

const Cases = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <CasesHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddCase={() => setShowAddDialog(true)}
        onBulkImport={() => setShowBulkImportDialog(true)}
      />

      <CasesMetrics />
      
      <CasesFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        assignedFilter={assignedFilter}
        onAssignedChange={setAssignedFilter}
      />

      {viewMode === 'grid' ? (
        <CasesGrid 
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          assignedFilter={assignedFilter}
        />
      ) : (
        <CasesTable 
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          assignedFilter={assignedFilter}
        />
      )}

      <AddCaseDialog 
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
      />

      <BulkImportCasesDialog
        open={showBulkImportDialog}
        onOpenChange={setShowBulkImportDialog}
      />
    </div>
  );
};

export default Cases;
