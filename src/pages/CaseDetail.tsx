import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Gavel, Calendar, AlertTriangle, StickyNote, CheckSquare } from 'lucide-react';
import { CaseDetailHeader } from '@/components/cases/detail/CaseDetailHeader';
import { CaseOverviewSection } from '@/components/cases/detail/CaseOverviewSection';
import { PartiesSection } from '@/components/cases/detail/PartiesSection';
import { DocumentsTab } from '@/components/cases/detail/tabs/DocumentsTab';
import { OrdersTab } from '@/components/cases/detail/tabs/OrdersTab';
import { HearingsTab } from '@/components/cases/detail/tabs/HearingsTab';
import { NotesTab } from '@/components/cases/detail/tabs/ObjectionsTab';
import { TasksTab } from '@/components/cases/detail/tabs/TasksTab';
import { CreateNoteMultiModal } from '@/components/notes/CreateNoteMultiModal';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { UploadDocumentDialog } from '@/components/documents/UploadDocumentDialog';
import { fetchLegalkartCaseId } from '@/components/cases/legalkart/utils';
import { toast } from 'sonner';

const CaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('documents');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch case data
  const { data: caseData, isLoading } = useQuery({
    queryKey: ['case-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Case ID is required');
      
      const { data: caseResult, error: caseError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', id)
        .single();
      
      if (caseError) throw caseError;
      return caseResult;
    },
    enabled: !!id
  });

  // Fetch LegalKart data if CNR exists
  const { data: legalKartData } = useQuery({
    queryKey: ['legalkart-case-data', id],
    queryFn: async () => {
      if (!id) return null;
      const lkCaseId = await fetchLegalkartCaseId(id);
      if (!lkCaseId) return null;

      const { data, error } = await supabase
        .from('legalkart_cases')
        .select('*')
        .eq('id', lkCaseId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!caseData?.cnr_number
  });

  const handleRefreshData = async () => {
    if (!caseData?.cnr_number) {
      toast.error('No CNR number found for this case');
      return;
    }

    setIsRefreshing(true);
    try {
      // Trigger LegalKart API fetch here
      toast.success('Refreshing case data from LegalKart API...');
      
      // Invalidate queries to refetch
      await queryClient.invalidateQueries({ queryKey: ['legalkart-case-data', id] });
      await queryClient.invalidateQueries({ queryKey: ['case-detail', id] });
      
      toast.success('Case data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh case data');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse p-6 space-y-6">
        <div className="h-16 bg-[#E5E7EB] rounded-2xl"></div>
        <div className="h-48 bg-[#E5E7EB] rounded-2xl"></div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 bg-[#E5E7EB] rounded-2xl"></div>
          <div className="h-64 bg-[#E5E7EB] rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <p className="text-[#6B7280]">Case not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <CaseDetailHeader
        caseTitle={caseData.case_title || caseData.title || 'Untitled Case'}
        onAddNote={() => setShowNoteModal(true)}
        onAddTask={() => setShowTaskDialog(true)}
        onUploadDocument={() => setShowUploadDialog(true)}
        onRefreshData={handleRefreshData}
        isRefreshing={isRefreshing}
      />

      <CaseOverviewSection caseData={caseData} legalKartData={legalKartData} />

      {legalKartData && (
        <PartiesSection
          petitionerString={legalKartData.petitioner_and_advocate}
          respondentString={legalKartData.respondent_and_advocate}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#F9FAFB] p-1 rounded-xl w-full justify-start">
          <TabsTrigger value="documents" className="rounded-lg">
            <FileText className="w-4 h-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="orders" className="rounded-lg">
            <Gavel className="w-4 h-4 mr-2" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="hearings" className="rounded-lg">
            <Calendar className="w-4 h-4 mr-2" />
            Hearings
          </TabsTrigger>
          <TabsTrigger value="objections" className="rounded-lg">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Objections
          </TabsTrigger>
          <TabsTrigger value="notes" className="rounded-lg">
            <StickyNote className="w-4 h-4 mr-2" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-lg">
            <CheckSquare className="w-4 h-4 mr-2" />
            Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <DocumentsTab caseId={id!} />
        </TabsContent>

        <TabsContent value="orders">
          <OrdersTab caseId={id!} />
        </TabsContent>

        <TabsContent value="hearings">
          <HearingsTab caseId={id!} />
        </TabsContent>

        <TabsContent value="objections">
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
            <p className="text-[#6B7280]">Objections data will be displayed here</p>
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <NotesTab caseId={id!} />
        </TabsContent>

        <TabsContent value="tasks">
          <TasksTab caseId={id!} />
        </TabsContent>
      </Tabs>

      <CreateNoteMultiModal
        open={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        caseId={id}
      />

      {showTaskDialog && (
        <CreateTaskDialog
          open={showTaskDialog}
          onClose={() => setShowTaskDialog(false)}
          caseId={id}
        />
      )}

      {showUploadDialog && (
        <UploadDocumentDialog
          open={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          caseId={id}
        />
      )}
    </div>
  );
};

export default CaseDetail;
