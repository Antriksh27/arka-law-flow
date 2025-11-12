
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavBar } from '@/components/mobile/BottomNavBar';
import { SegmentedControl } from '@/components/mobile/SegmentedControl';
import { BottomSheet } from '@/components/mobile/BottomSheet';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, Plus, Upload, Link as LinkIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

const Cases = () => {
  const { user } = useAuth();
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

  // Fetch case stats for mobile hero section
  const { data: caseStats } = useQuery({
    queryKey: ['case-stats', user?.id],
    queryFn: async () => {
      const { count: activeCount } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'disposed');
      
      const { count: overdueCount } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .lt('next_hearing_date', new Date().toISOString())
        .neq('status', 'disposed');

      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const { count: thisWeekCount } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .gte('next_hearing_date', startOfWeek.toISOString());

      return {
        active: activeCount || 0,
        overdue: overdueCount || 0,
        thisWeek: thisWeekCount || 0,
      };
    },
    enabled: !!user && isMobile,
  });

  useEffect(() => {
    console.log('Cases component mounted');
    console.log('Filters state:', { statusFilter, typeFilter, assignedFilter });
  }, []);

  useEffect(() => {
    console.log('Filter values changed:', { statusFilter, typeFilter, assignedFilter });
  }, [statusFilter, typeFilter, assignedFilter]);

  const handleRefresh = async () => {
    // Placeholder for refresh logic
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  // Mobile segmented filter options
  const filterSegments = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'disposed', label: 'Disposed' },
    { value: 'my', label: 'My Cases' },
  ];

  return (
    <>
      {/* Mobile Header */}
      {isMobile && (
        <MobileHeader
          title="Cases"
          actions={
            <button
              onClick={() => setShowAddDialog(true)}
              className="p-2 rounded-lg active:scale-95 transition-transform"
            >
              <Search className="w-5 h-5" />
            </button>
          }
        />
      )}

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 pb-24 sm:pb-6">
          {/* Desktop Header */}
          <div className="hidden sm:block">
            <CasesHeader onAddCase={() => setShowAddDialog(true)} />
          </div>

          {/* Mobile Hero Stats Card */}
          {isMobile && caseStats && (
            <Card className="p-4 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/20 border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Stats</h3>
              <div className="flex justify-between gap-3">
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold text-foreground">{caseStats.active}</div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
                <div className="w-px bg-border" />
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold text-destructive">{caseStats.overdue}</div>
                  <div className="text-xs text-muted-foreground">Overdue</div>
                </div>
                <div className="w-px bg-border" />
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold text-primary">{caseStats.thisWeek}</div>
                  <div className="text-xs text-muted-foreground">This Week</div>
                </div>
              </div>
            </Card>
          )}

          {/* Mobile Segmented Filter */}
          {isMobile ? (
            <SegmentedControl
              segments={filterSegments}
              value={statusFilter === 'all' && casesTab === 'all' ? 'all' : 
                     statusFilter === 'active' ? 'active' :
                     statusFilter === 'disposed' ? 'disposed' : 'my'}
              onChange={(value) => {
                if (value === 'my') {
                  setCasesTab('my');
                  setStatusFilter('all');
                } else {
                  setCasesTab('all');
                  setStatusFilter(value);
                }
              }}
            />
          ) : (
            // Desktop Tabs
            <Tabs value={casesTab} onValueChange={(value) => setCasesTab(value as 'all' | 'my')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white rounded-2xl shadow-sm border border-gray-200 mb-4 sm:mb-6 h-12 sm:h-10">
                <TabsTrigger value="all" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-base sm:text-sm">
                  All Cases
                </TabsTrigger>
                <TabsTrigger value="my" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-base sm:text-sm">
                  My Cases
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 sm:space-y-6 mt-0">
                {!isMobile && (
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
                )}

                {viewMode === 'grid' || isMobile ? (
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

              <TabsContent value="my" className="space-y-4 sm:space-y-6 mt-0">
                {!isMobile && (
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
                )}

                {viewMode === 'grid' || isMobile ? (
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
          )}

          {/* Desktop Filters (when not using tabs) */}
          {!isMobile && casesTab === 'all' && (
            <div className="hidden sm:block">
              {/* Filters are already rendered inside tabs */}
            </div>
          )}

          {/* Mobile FAB with Bottom Sheet */}
          {isMobile ? (
            <>
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
            </>
          ) : (
            <CaseMobileFAB onClick={() => setShowAddDialog(true)} />
          )}
        </div>
      </PullToRefresh>

      {/* Bottom Navigation */}
      {isMobile && <BottomNavBar />}

      {/* Dialogs */}
      <AddCaseDialog 
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
      />

      <BulkImportCasesDialog
        open={showBulkImportDialog}
        onOpenChange={setShowBulkImportDialog}
        onSuccess={() => {
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
    </>
  );
};

export default Cases;
