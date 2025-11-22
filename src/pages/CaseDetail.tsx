import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { CaseDetailHeaderNew } from '@/components/cases/detail/CaseDetailHeaderNew';
import { CaseInfoCard } from '@/components/cases/detail/CaseInfoCard';
import { PartiesInfoCard } from '@/components/cases/detail/PartiesInfoCard';
import { IADetailsCard } from '@/components/cases/detail/IADetailsCard';
import { CaseDocuments } from '@/components/cases/CaseDocuments';
import { CaseHearings } from '@/components/cases/CaseHearings';
import { CaseTasks } from '@/components/cases/CaseTasks';
import { CaseNotes } from '@/components/cases/CaseNotes';
import { CreateNoteMultiModal } from '@/components/notes/CreateNoteMultiModal';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { DocumentsTable } from '@/components/cases/enhanced/DocumentsTable';
import { OrdersTable } from '@/components/cases/enhanced/OrdersTable';
import { HearingsTable } from '@/components/cases/enhanced/HearingsTable';
import { ObjectionsTable } from '@/components/cases/enhanced/ObjectionsTable';
import { InvoicesTab } from '@/components/cases/detail/tabs/InvoicesTab';
import { ExpensesTab } from '@/components/cases/detail/tabs/ExpensesTab';
import { PaymentsTab } from '@/components/cases/detail/tabs/PaymentsTab';
import { LawyersTab } from '@/components/cases/detail/tabs/LawyersTab';
import { SCDiaryBenchCard } from '@/components/cases/supreme/SCDiaryBenchCard';
import { SCEarlierCourtsTable } from '@/components/cases/supreme/SCEarlierCourtsTable';
import { SCTaggedMattersTable } from '@/components/cases/supreme/SCTaggedMattersTable';
import { SCListingHistoryTimeline } from '@/components/cases/supreme/SCListingHistoryTimeline';
import { SCNoticesTable } from '@/components/cases/supreme/SCNoticesTable';
import { SCDefectsTable } from '@/components/cases/supreme/SCDefectsTable';
import { SCJudgementOrdersTable } from '@/components/cases/supreme/SCJudgementOrdersTable';
import { SCOfficeReportsTable } from '@/components/cases/supreme/SCOfficeReportsTable';

const CaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch case data
  const { data: caseData, isLoading } = useQuery({
    queryKey: ['case-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Case ID is required');
      
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Fetch petitioners
  const { data: petitioners = [] } = useQuery({
    queryKey: ['petitioners', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('petitioners')
        .select('*')
        .eq('case_id', id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!id
  });

  // Fetch respondents
  const { data: respondents = [] } = useQuery({
    queryKey: ['respondents', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('respondents')
        .select('*')
        .eq('case_id', id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!id
  });

  // Fetch IA details
  const { data: iaDetails = [] } = useQuery({
    queryKey: ['ia-details', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ia_details')
        .select('*')
        .eq('case_id', id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!id
  });

  // Fetch legalkart case ID for enhanced data
  const { data: legalkartCase } = useQuery({
    queryKey: ['legalkart-case', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legalkart_cases')
        .select('*')
        .eq('case_id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Fetch documents from case_documents
  const { data: documents = [] } = useQuery({
    queryKey: ['case-documents', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('case_documents')
        .select('*')
        .eq('case_id', id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!id
  });

  // Fetch orders from case_orders
  const { data: orders = [] } = useQuery({
    queryKey: ['case-orders', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('case_orders')
        .select('*')
        .eq('case_id', id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!id
  });

  // Fetch objections from case_objections
  const { data: objections = [] } = useQuery({
    queryKey: ['case-objections', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('case_objections')
        .select('*')
        .eq('case_id', id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!id
  });

  // Fetch hearings from case_hearings
  const { data: hearings = [] } = useQuery({
    queryKey: ['case-hearings', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('case_hearings')
        .select('*')
        .eq('case_id', id)
        .order('hearing_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!id
  });

  // Auto-upsert relational data on first load if fetched_data exists but child tables are empty
  const [autoUpsertDone, setAutoUpsertDone] = useState(false);
  useEffect(() => {
    if (!id || autoUpsertDone) return;
    const totals = (petitioners?.length || 0)
      + (respondents?.length || 0)
      + (iaDetails?.length || 0)
      + (documents?.length || 0)
      + (orders?.length || 0)
      + (objections?.length || 0)
      + (hearings?.length || 0);
    if (totals === 0 && caseData?.fetched_data) {
      supabase.functions.invoke('legalkart-api', {
        body: { action: 'upsert_from_json', caseId: id, rawData: caseData.fetched_data }
      }).then(() => {
        setAutoUpsertDone(true);
        queryClient.invalidateQueries({ queryKey: ['petitioners', id] });
        queryClient.invalidateQueries({ queryKey: ['respondents', id] });
        queryClient.invalidateQueries({ queryKey: ['ia-details', id] });
        queryClient.invalidateQueries({ queryKey: ['case-documents', id] });
        queryClient.invalidateQueries({ queryKey: ['case-orders', id] });
        queryClient.invalidateQueries({ queryKey: ['case-objections', id] });
        queryClient.invalidateQueries({ queryKey: ['case-hearings', id] });
      }).catch((e) => console.error('Auto upsert failed:', e));
    }
  }, [id, autoUpsertDone, caseData?.fetched_data, petitioners, respondents, iaDetails, documents, orders, objections, hearings]);

  // Refresh case data mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      console.log('Refreshing case data...');
      
      // First, try to upsert from existing fetched_data
      const { data: caseInfo } = await supabase
        .from('cases')
        .select('fetched_data, cnr_number, firm_id')
        .eq('id', id!)
        .single();

      if (caseInfo?.fetched_data) {
        console.log('📥 Upserting from existing fetched_data...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          try {
            await supabase.functions.invoke('legalkart-api', {
              body: {
                action: 'upsert_from_json',
                caseId: id,
                rawData: caseInfo.fetched_data
              },
              headers: {
                Authorization: `Bearer ${session.access_token}`
              }
            });
            console.log('✅ Successfully upserted from existing data');
          } catch (error) {
            console.error('Error upserting from existing data:', error);
          }
        }
      }

      // Then proceed with external search if CNR is available
      if (!caseInfo?.cnr_number) {
        throw new Error('No CNR number found for this case');
      }

      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) throw new Error('Not authenticated');

      const { data: teamMember } = await supabase
        .from('team_members')
        .select('firm_id')
        .eq('user_id', authUser.user.id)
        .single();

      if (!teamMember) throw new Error('Firm not found');

      const { data, error } = await supabase.functions.invoke('legalkart-api', {
        body: {
          action: 'search',
          cnr: caseInfo.cnr_number,
          searchType: 'high_court',
          caseId: id,
          firmId: teamMember.firm_id
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      // Check if the fetch was actually successful
      if (!data?.success) {
        toast({
          title: "No case data found",
          description: data?.error || "Unable to fetch case details from eCourts",
          variant: "destructive"
        });
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['case-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['legalkart-case', id] });
      queryClient.invalidateQueries({ queryKey: ['petitioners', id] });
      queryClient.invalidateQueries({ queryKey: ['respondents', id] });
      queryClient.invalidateQueries({ queryKey: ['ia-details', id] });
      queryClient.invalidateQueries({ queryKey: ['case-documents', id] });
      queryClient.invalidateQueries({ queryKey: ['case-orders', id] });
      queryClient.invalidateQueries({ queryKey: ['case-objections', id] });
      queryClient.invalidateQueries({ queryKey: ['case-hearings', id] });
      toast({ title: "Case data refreshed successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to refresh case data",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <p className="text-lg text-[#6B7280]">Case not found</p>
      </div>
    );
  }

  // Detect if this is a Supreme Court case
  const isSupremeCourt = 
    legalkartCase?.diary_number || 
    legalkartCase?.bench_composition?.length > 0 ||
    caseData?.court_name?.toLowerCase().includes('supreme') ||
    caseData?.cnr_number?.toUpperCase().startsWith('SCIN');

  console.log('🏛️ Is Supreme Court case:', isSupremeCourt);

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header with Quick Actions */}
        <CaseDetailHeaderNew
          caseData={caseData}
          onRefresh={() => refreshMutation.mutate()}
          onAddNote={() => setIsNoteModalOpen(true)}
          onAddTask={() => setIsTaskModalOpen(true)}
          onViewDocuments={() => setActiveTab('documents')}
          isRefreshing={refreshMutation.isPending}
        />

        {/* SC Diary & Bench Card - Prominent Display for Supreme Court Cases */}
        {isSupremeCourt && legalkartCase && (
          <SCDiaryBenchCard caseData={caseData} legalkartCase={legalkartCase} />
        )}

        {/* Main Details Cards */}
        <div className="space-y-6">
          <CaseInfoCard caseData={caseData} legalkartCase={legalkartCase} isSupremeCourt={isSupremeCourt} />
          
          {(petitioners.length > 0 || respondents.length > 0) && (
            <PartiesInfoCard petitioners={petitioners} respondents={respondents} />
          )}
          
          <IADetailsCard iaDetails={iaDetails} />
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${isSupremeCourt ? 'grid-cols-12 text-xs' : 'grid-cols-10'} mb-6`}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lawyers">👨‍⚖️ Lawyers</TabsTrigger>
            <TabsTrigger value="documents">📄 Docs</TabsTrigger>
            <TabsTrigger value="orders">⚖️ Orders</TabsTrigger>
            <TabsTrigger value="hearings">📅 Hearings</TabsTrigger>
            <TabsTrigger value="objections">🚫 Obj</TabsTrigger>
            {isSupremeCourt && (
              <>
                <TabsTrigger value="sc-earlier-courts">🏛️ Lower</TabsTrigger>
                <TabsTrigger value="sc-tagged">🔗 Tagged</TabsTrigger>
                <TabsTrigger value="sc-listing">📋 Listings</TabsTrigger>
                <TabsTrigger value="sc-notices">📬 Notices</TabsTrigger>
                <TabsTrigger value="sc-defects">⚠️ Defects</TabsTrigger>
                <TabsTrigger value="sc-orders">📜 SC Orders</TabsTrigger>
              </>
            )}
            <TabsTrigger value="invoices">💰 Inv</TabsTrigger>
            <TabsTrigger value="expenses">💳 Exp</TabsTrigger>
            <TabsTrigger value="payments">💵 Pay</TabsTrigger>
          </TabsList>

          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
            <TabsContent value="overview" className="mt-0">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-[#111827]">Case Overview</h3>
                <p className="text-[#6B7280]">
                  {caseData.description || caseData.case_summary || 'No description available'}
                </p>
                {caseData.tags && caseData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {caseData.tags.map((tag: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-[#E0E7FF] text-[#1E3A8A] text-sm rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="lawyers" className="mt-0">
              <LawyersTab caseId={id!} />
            </TabsContent>

            <TabsContent value="documents" className="mt-0">
              <DocumentsTable documents={documents} />
            </TabsContent>

            <TabsContent value="orders" className="mt-0">
              <OrdersTable orders={orders} />
            </TabsContent>

            <TabsContent value="hearings" className="mt-0">
              <HearingsTable hearings={hearings} />
            </TabsContent>

            <TabsContent value="objections" className="mt-0">
              <ObjectionsTable objections={objections} />
            </TabsContent>

            <TabsContent value="invoices" className="mt-0">
              <InvoicesTab caseId={id!} />
            </TabsContent>

            <TabsContent value="expenses" className="mt-0">
              <ExpensesTab caseId={id!} />
            </TabsContent>

            <TabsContent value="payments" className="mt-0">
              <PaymentsTab caseId={id!} />
            </TabsContent>

            {/* Supreme Court Specific Tabs */}
            {isSupremeCourt && (
              <>
                <TabsContent value="sc-earlier-courts" className="mt-0">
                  <SCEarlierCourtsTable caseId={id!} />
                </TabsContent>
                
                <TabsContent value="sc-tagged" className="mt-0">
                  <SCTaggedMattersTable caseId={id!} />
                </TabsContent>
                
                <TabsContent value="sc-listing" className="mt-0">
                  <SCListingHistoryTimeline caseId={id!} />
                </TabsContent>
                
                <TabsContent value="sc-notices" className="mt-0">
                  <SCNoticesTable caseId={id!} />
                </TabsContent>
                
                <TabsContent value="sc-defects" className="mt-0">
                  <SCDefectsTable caseId={id!} />
                </TabsContent>
                
                <TabsContent value="sc-orders" className="mt-0">
                  <SCJudgementOrdersTable caseId={id!} />
                </TabsContent>
              </>
            )}

          </div>
        </Tabs>

        {/* Modals */}
        {isNoteModalOpen && (
          <CreateNoteMultiModal
            open={isNoteModalOpen}
            onClose={() => setIsNoteModalOpen(false)}
            caseId={id}
          />
        )}

        {isTaskModalOpen && (
          <CreateTaskDialog
            open={isTaskModalOpen}
            onClose={() => setIsTaskModalOpen(false)}
            caseId={id}
          />
        )}
      </div>
    </div>
  );
};

export default CaseDetail;
