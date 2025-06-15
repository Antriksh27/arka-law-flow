
import React, { useState, useEffect } from 'react';
import { CasesHeader } from '../components/cases/CasesHeader';
import { CasesFilters } from '../components/cases/CasesFilters';
import { CasesGrid } from '../components/cases/CasesGrid';
import { CasesTable } from '../components/cases/CasesTable';
import { AddCaseDialog } from '../components/cases/AddCaseDialog';

const Cases = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    console.log('Cases component mounted');
    console.log('Filters state:', { statusFilter, typeFilter, assignedFilter });
  }, []);

  useEffect(() => {
    console.log('Filter values changed:', { statusFilter, typeFilter, assignedFilter });
  }, [statusFilter, typeFilter, assignedFilter]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <CasesHeader 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddCase={() => setShowAddDialog(true)}
      />
      
      <CasesFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={(value) => {
          console.log('Status filter changing to:', value);
          setStatusFilter(value);
        }}
        typeFilter={typeFilter}
        onTypeChange={(value) => {
          console.log('Type filter changing to:', value);
          setTypeFilter(value);
        }}
        assignedFilter={assignedFilter}
        onAssignedChange={(value) => {
          console.log('Assigned filter changing to:', value);
          setAssignedFilter(value);
        }}
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
  );
};

export default Cases;
