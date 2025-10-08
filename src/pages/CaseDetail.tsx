import React, { useState } from 'react';
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

  // Fetch documents from legalkart
  const { data: documents = [] } = useQuery({
    queryKey: ['legalkart-documents', id],
    queryFn: async () => {
      if (!legalkartCase?.id) return [];
      const { data, error } = await supabase
        .from('legalkart_case_documents')
        .select('*')
        .eq('legalkart_case_id', legalkartCase.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!legalkartCase?.id
  });

  // Fetch orders from legalkart
  const { data: orders = [] } = useQuery({
    queryKey: ['legalkart-orders', id],
    queryFn: async () => {
      if (!legalkartCase?.id) return [];
      const { data, error } = await supabase
        .from('legalkart_case_orders')
        .select('*')
        .eq('legalkart_case_id', legalkartCase.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!legalkartCase?.id
  });

  // Fetch objections from legalkart
  const { data: objections = [] } = useQuery({
    queryKey: ['legalkart-objections', id],
    queryFn: async () => {
      if (!legalkartCase?.id) return [];
      const { data, error } = await supabase
        .from('legalkart_case_objections')
        .select('*')
        .eq('legalkart_case_id', legalkartCase.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!legalkartCase?.id
  });

  // Fetch hearings from legalkart
  const { data: hearings = [] } = useQuery({
    queryKey: ['legalkart-hearings', id],
    queryFn: async () => {
      if (!legalkartCase?.id) return [];
      const { data, error } = await supabase
        .from('legalkart_case_history')
        .select('*')
        .eq('legalkart_case_id', legalkartCase.id)
        .order('hearing_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!legalkartCase?.id
  });

  // Refresh case data mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      if (!caseData?.cnr_number) {
        throw new Error('CNR number not found');
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
          cnr: caseData.cnr_number,
          searchType: 'high_court',
          caseId: id,
          firmId: teamMember.firm_id
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['legalkart-case', id] });
      queryClient.invalidateQueries({ queryKey: ['petitioners', id] });
      queryClient.invalidateQueries({ queryKey: ['respondents', id] });
      queryClient.invalidateQueries({ queryKey: ['ia-details', id] });
      queryClient.invalidateQueries({ queryKey: ['legalkart-documents', id] });
      queryClient.invalidateQueries({ queryKey: ['legalkart-orders', id] });
      queryClient.invalidateQueries({ queryKey: ['legalkart-objections', id] });
      queryClient.invalidateQueries({ queryKey: ['legalkart-hearings', id] });
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

        {/* Main Details Cards */}
        <div className="space-y-6">
          <CaseInfoCard caseData={caseData} />
          
          {(petitioners.length > 0 || respondents.length > 0) && (
            <PartiesInfoCard petitioners={petitioners} respondents={respondents} />
          )}
          
          <IADetailsCard iaDetails={iaDetails} />
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">📄 Documents</TabsTrigger>
            <TabsTrigger value="orders">⚖️ Orders</TabsTrigger>
            <TabsTrigger value="hearings">📅 Hearings</TabsTrigger>
            <TabsTrigger value="objections">🚫 Objections</TabsTrigger>
            <TabsTrigger value="notes">🗒️ Notes</TabsTrigger>
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

            <TabsContent value="notes" className="mt-0">
              <CaseNotes caseId={id!} />
            </TabsContent>
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
