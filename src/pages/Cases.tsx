
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CasesHeader } from '../components/cases/CasesHeader';
import { CasesFilters } from '../components/cases/CasesFilters';
import { CasesGrid } from '../components/cases/CasesGrid';
import { CasesTable } from '../components/cases/CasesTable';
import { AddCaseDialog } from '../components/cases/AddCaseDialog';
import { BulkImportCasesDialog } from '../components/cases/BulkImportCasesDialog';
import { BulkImportDisposedCasesDialog } from '../components/cases/BulkImportDisposedCasesDialog';
import { StandardizeCNRDialog } from '../components/cases/StandardizeCNRDialog';
import { LinkClientsDialog } from '../components/cases/LinkClientsDialog';
import { CaseMobileFAB } from '../components/cases/CaseMobileFAB';
import { MobileFiltersSheet } from '@/components/cases/MobileFiltersSheet';
import { MobileStickyHeader } from '@/components/mobile/MobileStickyHeader';

import { BottomSheet } from '@/components/mobile/BottomSheet';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Upload, Link as LinkIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Cases = () => {
  const { user, firmId } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
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
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);

  // Fetch distinct case statuses for filters (from DB)
  const { data: statusOptions = [] } = useQuery({
    queryKey: ['case-status-options', user?.id, firmId],
    queryFn: async () => {
      let query = supabase
        .from('cases')
        .select('status')
        .not('status', 'is', null);
      
      if (firmId) {
        query = query.eq('firm_id', firmId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      const unique = Array.from(new Set((data || []).map((d: any) => d.status).filter(Boolean)));
      return unique as string[];
    },
    enabled: !!user && !!firmId,
  });

  useEffect(() => {
    console.log('Cases component mounted');
    console.log('Filters state:', { statusFilter, typeFilter, assignedFilter });
  }, []);

  useEffect(() => {
    console.log('Filter values changed:', { statusFilter, typeFilter, assignedFilter });
  }, [statusFilter, typeFilter, assignedFilter]);

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['cases'] }),
      queryClient.invalidateQueries({ queryKey: ['case-stats', user?.id] }),
    ]);
  };

  const activeFiltersCount = [
    statusFilter !== 'all',
    typeFilter !== 'all',
    assignedFilter !== 'all'
  ].filter(Boolean).length;

  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col">
        <MobileStickyHeader
          title="Cases"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search cases..."
          onFilterClick={() => setShowFiltersSheet(true)}
          activeFiltersCount={activeFiltersCount}
          tabs={[
            { value: 'all', label: 'All Cases' },
            { value: 'my', label: 'My Cases' },
          ]}
          activeTab={casesTab}
          onTabChange={(value) => setCasesTab(value as 'all' | 'my')}
        />

        <div className="flex-1 min-h-0 overflow-y-auto">
          <PullToRefresh onRefresh={handleRefresh}>
            <div className="px-4 pt-4 pb-24 space-y-4">
              <CasesGrid 
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                typeFilter={typeFilter}
                assignedFilter={assignedFilter}
                showOnlyMyCases={casesTab === 'my'}
              />
            </div>
          </PullToRefresh>
        </div>

        <CaseMobileFAB onClick={() => setShowMobileActions(true)} />
        
        <BottomSheet
          open={showMobileActions}
          onClose={() => setShowMobileActions(false)}
          title="Case Actions"
        >
          <div className="space-y-3 pb-6">
            <button
              onClick={() => {
                setShowMobileActions(false);
                setShowAddDialog(true);
              }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-primary text-primary-foreground active:scale-98 transition-transform"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add New Case</span>
            </button>
            <button
              onClick={() => {
                setShowMobileActions(false);
                setShowBulkImportDialog(true);
              }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-secondary text-secondary-foreground active:scale-98 transition-transform"
            >
              <Upload className="w-5 h-5" />
              <span className="font-medium">Import Cases</span>
            </button>
            <button
              onClick={() => {
                setShowMobileActions(false);
                setShowLinkClientsDialog(true);
              }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-secondary text-secondary-foreground active:scale-98 transition-transform"
            >
              <LinkIcon className="w-5 h-5" />
              <span className="font-medium">Link Clients</span>
            </button>
          </div>
        </BottomSheet>

        <AddCaseDialog 
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
        />

        <BulkImportCasesDialog
          open={showBulkImportDialog}
          onOpenChange={setShowBulkImportDialog}
          onSuccess={() => console.log('Cases imported successfully')}
        />

        <BulkImportDisposedCasesDialog
          open={showBulkImportDisposedDialog}
          onOpenChange={setShowBulkImportDisposedDialog}
          onSuccess={() => console.log('Disposed cases imported successfully')}
        />

        <StandardizeCNRDialog
          open={showStandardizeCNRDialog}
          onOpenChange={setShowStandardizeCNRDialog}
          onSuccess={() => console.log('CNR numbers standardized successfully')}
        />

        <LinkClientsDialog
          open={showLinkClientsDialog}
          onOpenChange={setShowLinkClientsDialog}
          onSuccess={() => console.log('Clients linked successfully')}
        />

        <MobileFiltersSheet
          open={showFiltersSheet}
          onClose={() => setShowFiltersSheet(false)}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          assignedFilter={assignedFilter}
          onAssignedChange={setAssignedFilter}
          onClearFilters={() => {
            setStatusFilter('all');
            setTypeFilter('all');
            setAssignedFilter('all');
          }}
        />
      </div>
    );
  }

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="max-w-7xl mx-auto p-6 space-y-6 pb-6">
          <CasesHeader onAddCase={() => setShowAddDialog(true)} />

          <Tabs value={casesTab} onValueChange={(value) => setCasesTab(value as 'all' | 'my')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white rounded-2xl shadow-sm border border-gray-200 mb-4 sm:mb-6 h-10">
              <TabsTrigger value="all" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-sm">
                All Cases
              </TabsTrigger>
              <TabsTrigger value="my" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-sm">
                My Cases
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6 mt-0">
              <CasesFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                typeFilter={typeFilter}
                onTypeChange={setTypeFilter}
                assignedFilter={assignedFilter}
                onAssignedChange={setAssignedFilter}
                statusOptions={statusOptions}
              />
              <CasesTable 
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                typeFilter={typeFilter}
                assignedFilter={assignedFilter}
                showOnlyMyCases={false}
              />
            </TabsContent>

            <TabsContent value="my" className="space-y-6 mt-0">
              <CasesFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                typeFilter={typeFilter}
                onTypeChange={setTypeFilter}
                assignedFilter={assignedFilter}
                onAssignedChange={setAssignedFilter}
                statusOptions={statusOptions}
              />
              <CasesTable 
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                typeFilter={typeFilter}
                assignedFilter={assignedFilter}
                showOnlyMyCases={true}
              />
            </TabsContent>
          </Tabs>
        </div>
      </PullToRefresh>

      <AddCaseDialog 
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
      />

      <BulkImportCasesDialog
        open={showBulkImportDialog}
        onOpenChange={setShowBulkImportDialog}
        onSuccess={() => console.log('Cases imported successfully')}
      />

      <BulkImportDisposedCasesDialog
        open={showBulkImportDisposedDialog}
        onOpenChange={setShowBulkImportDisposedDialog}
        onSuccess={() => console.log('Disposed cases imported successfully')}
      />

      <StandardizeCNRDialog
        open={showStandardizeCNRDialog}
        onOpenChange={setShowStandardizeCNRDialog}
        onSuccess={() => console.log('CNR numbers standardized successfully')}
      />

      <LinkClientsDialog
        open={showLinkClientsDialog}
        onOpenChange={setShowLinkClientsDialog}
        onSuccess={() => console.log('Clients linked successfully')}
      />
    </>
  );
};

export default Cases;
