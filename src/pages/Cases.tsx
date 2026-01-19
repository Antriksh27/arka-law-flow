
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

//
import { BottomSheet } from '@/components/mobile/BottomSheet';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SlidersHorizontal, Plus, Upload, Link as LinkIcon, CheckCircle, Calendar } from 'lucide-react';
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

  return (
    <>
      {/* Mobile Header */}
      {isMobile && (
        <MobileHeader title="Cases" />
      )}

      <PullToRefresh onRefresh={handleRefresh}>
        <div className={`max-w-7xl mx-auto space-y-4 pb-24 ${isMobile ? 'px-4 pt-4' : 'p-6 space-y-6 pb-6'}`}>
          {/* Desktop Header - only show on desktop */}
          {!isMobile && (
            <CasesHeader onAddCase={() => setShowAddDialog(true)} />
          )}

          {/* Mobile Search Bar */}
          {isMobile && (
            <MobileSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onFilterClick={() => setShowFiltersSheet(true)}
              activeFiltersCount={activeFiltersCount}
            />
          )}

          {/* Mobile Hero Stats Card - Horizontal Scroll Strip */}
          {isMobile && (
            isLoadingStats ? (
              <div className="overflow-x-auto -mx-4 px-4">
                <div className="flex gap-3 min-w-max">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-[120px] rounded-2xl" />
                  ))}
                </div>
              </div>
            ) : caseStats ? (
              <div className="overflow-x-auto -mx-4 px-4">
                <div className="flex gap-3 min-w-max">
                  <div className="flex flex-col items-center justify-center p-4 bg-card rounded-2xl border border-border shadow-sm min-w-[110px]">
                    <div className="p-2 bg-primary/10 rounded-xl mb-2">
                      <SlidersHorizontal className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-xl font-bold text-foreground">{caseStats.active}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Active</div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-4 bg-card rounded-2xl border border-border shadow-sm min-w-[110px]">
                    <div className={`p-2 rounded-xl mb-2 ${caseStats.urgent === 0 ? 'bg-green-50' : 'bg-destructive/10'}`}>
                      {caseStats.urgent === 0 ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Calendar className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                    <div className={`text-xl font-bold ${caseStats.urgent === 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {caseStats.urgent}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {caseStats.urgent === 0 ? 'All Clear' : 'Urgent'}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-4 bg-card rounded-2xl border border-border shadow-sm min-w-[110px]">
                    <div className="p-2 bg-blue-50 rounded-xl mb-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-xl font-bold text-blue-600">{caseStats.nextWeek}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Next 7 Days</div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-4 bg-card rounded-2xl border border-border shadow-sm min-w-[110px]">
                    <div className="p-2 bg-amber-50 rounded-xl mb-2">
                      <Plus className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-xl font-bold text-amber-600">{caseStats.highPriority}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">High Priority</div>
                  </div>
                </div>
              </div>
            ) : null
          )}

          {/* Mobile Tabs */}
          {isMobile && (
            <Tabs value={casesTab} onValueChange={(value) => setCasesTab(value as 'all' | 'my')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-card rounded-2xl shadow-sm border border-border h-12 p-1">
                <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl text-sm font-medium transition-all h-10">
                  All Cases
                </TabsTrigger>
                <TabsTrigger value="my" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl text-sm font-medium transition-all h-10">
                  My Cases
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Desktop Tabs and Filters */}
          {!isMobile && (
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
          )}

          {/* Mobile: Show grid based on active tab */}
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
