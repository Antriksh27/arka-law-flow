
import React, { useState, useEffect } from 'react';
import { CasesHeader } from '../components/cases/CasesHeader';
import { CasesFilters } from '../components/cases/CasesFilters';
import { CasesGrid } from '../components/cases/CasesGrid';
import { CasesTable } from '../components/cases/CasesTable';
import { AddCaseDialog } from '../components/cases/AddCaseDialog';
import { BulkImportCasesDialog } from '../components/cases/BulkImportCasesDialog';
import { BulkImportDisposedCasesDialog } from '../components/cases/BulkImportDisposedCasesDialog';
import { StandardizeCNRDialog } from '../components/cases/StandardizeCNRDialog';
import { LinkClientsDialog } from '../components/cases/LinkClientsDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const Cases = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [casesTab, setCasesTab] = useState<'all' | 'my'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [showBulkImportDisposedDialog, setShowBulkImportDisposedDialog] = useState(false);
  const [showStandardizeCNRDialog, setShowStandardizeCNRDialog] = useState(false);
  const [showLinkClientsDialog, setShowLinkClientsDialog] = useState(false);

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
        onAddCase={() => setShowAddDialog(true)}
      />
      
      <Tabs value={casesTab} onValueChange={(value) => setCasesTab(value as 'all' | 'my')} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Cases</TabsTrigger>
          <TabsTrigger value="my">My Cases</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
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
              showOnlyMyCases={false}
            />
          ) : (
            <CasesTable 
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              typeFilter={typeFilter}
              assignedFilter={assignedFilter}
              showOnlyMyCases={false}
            />
          )}
        </TabsContent>

        <TabsContent value="my" className="space-y-6">
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
              showOnlyMyCases={true}
            />
          ) : (
            <CasesTable 
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              typeFilter={typeFilter}
              assignedFilter={assignedFilter}
              showOnlyMyCases={true}
            />
          )}
        </TabsContent>
      </Tabs>

      <AddCaseDialog 
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
      />

      <BulkImportCasesDialog
        open={showBulkImportDialog}
        onOpenChange={setShowBulkImportDialog}
        onSuccess={() => {
          // Refresh the cases list if needed
          console.log('Cases imported successfully');
        }}
      />

      <BulkImportDisposedCasesDialog
        open={showBulkImportDisposedDialog}
        onOpenChange={setShowBulkImportDisposedDialog}
        onSuccess={() => {
          console.log('Disposed cases imported successfully');
        }}
      />

      <StandardizeCNRDialog
        open={showStandardizeCNRDialog}
        onOpenChange={setShowStandardizeCNRDialog}
        onSuccess={() => {
          // Cases will be refreshed automatically via realtime subscriptions
          console.log('CNR numbers standardized successfully');
        }}
      />

      <LinkClientsDialog
        open={showLinkClientsDialog}
        onOpenChange={setShowLinkClientsDialog}
        onSuccess={() => {
          console.log('Clients linked successfully');
        }}
      />
    </div>
  );
};

export default Cases;
