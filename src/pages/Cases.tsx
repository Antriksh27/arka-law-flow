
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
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MobileSearchBar } from '@/components/cases/MobileSearchBar';
import { MobileFiltersSheet } from '@/components/cases/MobileFiltersSheet';
import { BottomNavBar } from '@/components/mobile/BottomNavBar';
import { SegmentedControl } from '@/components/mobile/SegmentedControl';
import { BottomSheet } from '@/components/mobile/BottomSheet';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SlidersHorizontal, Plus, Upload, Link as LinkIcon, CheckCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
const Cases = () => {
  const { user } = useAuth();
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

  // Fetch case stats for mobile hero section with proper logic
  const { data: caseStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['case-stats', user?.id],
    queryFn: async () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);
      const next7Days = new Date(now);
      next7Days.setDate(next7Days.getDate() + 7);
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Active cases (all non-disposed)
      const { count: activeCount } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'disposed');
      
      // Urgent: Hearings today or overdue (within last 30 days)
      const { count: urgentCount } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .lte('next_hearing_date', endOfToday.toISOString())
        .gte('next_hearing_date', thirtyDaysAgo.toISOString())
        .neq('status', 'disposed');

      // Next 7 days: Hearings in next week
      const { count: nextWeekCount } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .gte('next_hearing_date', now.toISOString())
        .lte('next_hearing_date', next7Days.toISOString());

      // High Priority cases
      const { count: highPriorityCount } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('priority', 'high')
        .neq('status', 'disposed');

      return {
        active: activeCount || 0,
        urgent: urgentCount || 0,
        nextWeek: nextWeekCount || 0,
        highPriority: highPriorityCount || 0,
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

  // Mobile segmented filter options - use valid status values
  const filterSegments = [
    { value: 'all', label: 'All' },
    { value: 'in_court', label: 'In Court' },
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
              onClick={() => setShowFiltersSheet(true)}
              className="p-2 rounded-lg active:scale-95 transition-transform relative"
            >
              <SlidersHorizontal className="w-5 h-5" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
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

          {/* Mobile Search Bar */}
          {isMobile && (
            <MobileSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onFilterClick={() => setShowFiltersSheet(true)}
              activeFiltersCount={activeFiltersCount}
            />
          )}

          {/* Mobile Hero Stats Card */}
          {isMobile && (
            isLoadingStats ? (
              <Skeleton className="h-32 rounded-2xl" />
            ) : caseStats ? (
              <Card className="p-4 bg-gradient-to-br from-primary/20 via-blue-100 to-accent/20 border-border shadow-md">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Overview</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col items-center p-3 bg-white/80 rounded-xl">
                    <div className="text-2xl font-bold text-foreground">{caseStats.active}</div>
                    <div className="text-xs text-muted-foreground">Active Cases</div>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 bg-white/80 rounded-xl">
                    <div className="text-2xl font-bold text-destructive">{caseStats.urgent}</div>
                    {caseStats.urgent === 0 ? (
                      <div className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        All clear!
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">Urgent Today</div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-center p-3 bg-white/80 rounded-xl">
                    <div className="text-2xl font-bold text-primary">{caseStats.nextWeek}</div>
                    <div className="text-xs text-muted-foreground">Next 7 Days</div>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 bg-white/80 rounded-xl">
                    <div className="text-2xl font-bold text-amber-600">{caseStats.highPriority}</div>
                    <div className="text-xs text-muted-foreground">High Priority</div>
                  </div>
                </div>
              </Card>
            ) : null
          )}

          {/* Mobile Segmented Filter */}
          {isMobile ? (
            <SegmentedControl
              segments={filterSegments}
              value={statusFilter === 'all' && casesTab === 'all' ? 'all' : 
                     statusFilter === 'in_court' ? 'in_court' :
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
          )}

          {/* Mobile: Always show grid view */}
          {isMobile && (
            <CasesGrid 
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              typeFilter={typeFilter}
              assignedFilter={assignedFilter}
              showOnlyMyCases={casesTab === 'my'}
            />
          )}

          {/* Mobile FAB with Bottom Sheet - Only on Mobile */}
          {isMobile && (
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

      {/* Mobile Filters Bottom Sheet */}
      {isMobile && (
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
      )}
    </>
  );
};

export default Cases;
