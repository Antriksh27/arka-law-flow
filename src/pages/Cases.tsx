
import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { CasesHeader } from '../components/cases/CasesHeader';
import { CasesFilters } from '../components/cases/CasesFilters';
import { CasesGrid } from '../components/cases/CasesGrid';
import { CasesTable } from '../components/cases/CasesTable';
import { AddCaseDialog } from '../components/cases/AddCaseDialog';

const Cases = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <CasesHeader 
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onAddCase={() => setShowAddDialog(true)}
        />
        
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
      </div>
    </DashboardLayout>
  );
};

export default Cases;
