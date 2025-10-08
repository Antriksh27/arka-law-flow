import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileText, File, Scale, Calendar, XCircle, StickyNote, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import { DetailsTab } from '@/components/cases/detail/tabs/DetailsTab';
import { DocumentsTab } from '@/components/cases/detail/tabs/DocumentsTab';
import { NotesTab } from '@/components/cases/detail/tabs/NotesTab';
import { TasksTab } from '@/components/cases/detail/tabs/TasksTab';
import { DocumentsTable } from '@/components/cases/enhanced/DocumentsTable';
import { OrdersTable } from '@/components/cases/enhanced/OrdersTable';
import { HearingsTable } from '@/components/cases/enhanced/HearingsTable';
import { ObjectionsTable } from '@/components/cases/enhanced/ObjectionsTable';
import { CreateNoteMultiModal } from '@/components/notes/CreateNoteMultiModal';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';

export default function CaseDetailEnhanced() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Fetch case data
  const { data: caseData, isLoading: caseLoading } = useQuery({
    queryKey: ['case', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch legalkart case data
  const { data: legalkartCase, isLoading: legalkartLoading } = useQuery({
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
    enabled: !!id,
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
      return data;
    },
    enabled: !!id,
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
      return data;
    },
    enabled: !!id,
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
      return data;
    },
    enabled: !!id,
  });

  // Fetch documents
  const { data: documents = [] } = useQuery({
    queryKey: ['legalkart-documents', legalkartCase?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legalkart_case_documents')
        .select('*')
        .eq('legalkart_case_id', legalkartCase?.id)
        .order('filed_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!legalkartCase?.id,
  });

  // Fetch orders
  const { data: orders = [] } = useQuery({
    queryKey: ['legalkart-orders', legalkartCase?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legalkart_case_orders')
        .select('*')
        .eq('legalkart_case_id', legalkartCase?.id)
        .order('order_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!legalkartCase?.id,
  });

  // Fetch hearings
  const { data: hearings = [] } = useQuery({
    queryKey: ['legalkart-hearings', legalkartCase?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legalkart_case_history')
        .select('*')
        .eq('legalkart_case_id', legalkartCase?.id)
        .order('hearing_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!legalkartCase?.id,
  });

  // Fetch objections
  const { data: objections = [] } = useQuery({
    queryKey: ['legalkart-objections', legalkartCase?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legalkart_case_objections')
        .select('*')
        .eq('legalkart_case_id', legalkartCase?.id)
        .order('objection_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!legalkartCase?.id,
  });

  // Refresh mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      if (!caseData?.cnr_number || !caseData?.firm_id) {
        throw new Error('CNR number or firm ID not found');
      }

      const { data, error } = await supabase.functions.invoke('legalkart-api', {
        body: {
          searchType: 'high_court',
          cnrNumber: caseData.cnr_number,
          firmId: caseData.firm_id,
          caseId: id,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      queryClient.invalidateQueries({ queryKey: ['legalkart-case', id] });
      queryClient.invalidateQueries({ queryKey: ['petitioners', id] });
      queryClient.invalidateQueries({ queryKey: ['respondents', id] });
      queryClient.invalidateQueries({ queryKey: ['ia-details', id] });
      queryClient.invalidateQueries({ queryKey: ['legalkart-documents'] });
      queryClient.invalidateQueries({ queryKey: ['legalkart-orders'] });
      queryClient.invalidateQueries({ queryKey: ['legalkart-hearings'] });
      queryClient.invalidateQueries({ queryKey: ['legalkart-objections'] });
      toast.success('Case data refreshed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to refresh case data');
    },
  });

  const tabs = [
    { value: 'details', label: 'Details', icon: FileText },
    { value: 'documents', label: 'Documents', icon: File },
    { value: 'orders', label: 'Orders', icon: Scale },
    { value: 'hearings', label: 'Hearings', icon: Calendar },
    { value: 'objections', label: 'Objections', icon: XCircle },
    { value: 'notes', label: 'Notes', icon: StickyNote },
    { value: 'tasks', label: 'Tasks', icon: CheckSquare },
  ];

  if (caseLoading || legalkartLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!caseData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Case not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                {caseData.case_title}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">CNR:</span> {caseData.cnr_number || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Filing No:</span> {legalkartCase?.filing_number || caseData.filing_number || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Next Hearing:</span> {caseData.next_hearing_date ? new Date(caseData.next_hearing_date).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNoteModalOpen(true)}
              >
                <StickyNote className="w-4 h-4 mr-2" />
                Add Note
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTaskModalOpen(true)}
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Add Task
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-white border-b border-gray-200 rounded-t-2xl h-auto p-0">
              <div className="flex flex-wrap sm:flex-nowrap overflow-x-auto">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-700 data-[state=active]:text-blue-800 data-[state=active]:bg-blue-50 bg-transparent rounded-none whitespace-nowrap transition-colors"
                    >
                      <IconComponent className="w-4 h-4" />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </div>
            </TabsList>

            <div className="p-6">
              <TabsContent value="details" className="m-0">
                <DetailsTab
                  caseData={caseData}
                  legalkartData={legalkartCase}
                  petitioners={petitioners}
                  respondents={respondents}
                  iaDetails={iaDetails}
                />
              </TabsContent>

              <TabsContent value="documents" className="m-0">
                <DocumentsTab caseId={id!} />
              </TabsContent>

              <TabsContent value="orders" className="m-0">
                <OrdersTable orders={orders} />
              </TabsContent>

              <TabsContent value="hearings" className="m-0">
                <HearingsTable hearings={hearings} />
              </TabsContent>

              <TabsContent value="objections" className="m-0">
                <ObjectionsTable objections={objections} />
              </TabsContent>

              <TabsContent value="notes" className="m-0">
                <NotesTab caseId={id!} />
              </TabsContent>

              <TabsContent value="tasks" className="m-0">
                <TasksTab caseId={id!} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

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
    </DashboardLayout>
  );
}
