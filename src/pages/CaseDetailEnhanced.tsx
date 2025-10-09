import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileText, File, Scale, Calendar, XCircle, StickyNote, CheckSquare, Pencil } from 'lucide-react';
import { format } from 'date-fns';

import { EditCaseDialog } from '@/components/cases/EditCaseDialog';
import { DetailsTab } from '@/components/cases/detail/tabs/DetailsTab';
import { DocumentsTab } from '@/components/cases/detail/tabs/DocumentsTab';
import { NotesTab } from '@/components/cases/detail/tabs/NotesTab';
import { TasksTab } from '@/components/cases/detail/tabs/TasksTab';
import { DocumentsTable } from '@/components/cases/enhanced/DocumentsTable';
import { OrdersTable } from '@/components/cases/enhanced/OrdersTable';
import { HearingsTable } from '@/components/cases/enhanced/HearingsTable';
import { ObjectionsTable } from '@/components/cases/enhanced/ObjectionsTable';
import { IADetailsTable } from '@/components/cases/enhanced/IADetailsTable';
import { CreateNoteMultiModal } from '@/components/notes/CreateNoteMultiModal';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { useLegalkartCaseDetails } from '@/hooks/useLegalkartCaseDetails';
export default function CaseDetailEnhanced() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  
  const [activeTab, setActiveTab] = useState('details');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch case data
  const {
    data: caseData,
    isLoading: caseLoading
  } = useQuery({
    queryKey: ['case', id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('cases').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Unified LegalKart/eCourt data via hook
  const {
    legalkartCase,
    petitioners = [],
    respondents = [],
    iaDetails = [],
    documents = [],
    orders = [],
    objections = [],
    hearings = [],
    isLoading: legalkartLoading,
    refreshCaseData,
    isRefreshing,
  } = useLegalkartCaseDetails(id!);

  // Refresh handled by useLegalkartCaseDetails.refreshCaseData
  const tabs = [{
    value: 'details',
    label: 'Details',
    icon: FileText
  }];
  if (caseLoading || legalkartLoading) {
    return <div className="min-h-screen bg-gray-50">
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>;
  }
  if (!caseData) {
    return <div className="min-h-screen bg-gray-50">
        <div className="text-center py-12">
          <p className="text-gray-500">Case not found</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50">
      {/* Single unified container */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm m-8">
        {/* Tabs with integrated header */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Header section integrated with tabs */}
          <div className="p-6 pb-0">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  {caseData.title || caseData.case_title || `${caseData.petitioner || 'Petitioner'} vs ${caseData.respondent || 'Respondent'}`}
                </h1>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">CNR:</span> {caseData.cnr_number || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Registration No:</span> {caseData.registration_number || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Filing No:</span> {legalkartCase?.filing_number || caseData.filing_number || 'N/A'}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Next Hearing:</span> {caseData.next_hearing_date ? format(new Date(caseData.next_hearing_date), 'dd/MM/yyyy') : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                
                
                
              </div>
            </div>
          </div>
          <TabsList className="w-full bg-white border-b border-gray-200 h-auto p-0">
            <div className="flex flex-wrap sm:flex-nowrap overflow-x-auto">
              {tabs.map(tab => {
              const IconComponent = tab.icon;
              return <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-700 data-[state=active]:text-blue-800 data-[state=active]:bg-blue-50 bg-transparent rounded-none whitespace-nowrap transition-colors">
                    <IconComponent className="w-4 h-4" />
                    {tab.label}
                  </TabsTrigger>;
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
                documents={documents}
                orders={orders}
                hearings={hearings}
                objections={objections}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Modals */}
      {isNoteModalOpen && <CreateNoteMultiModal open={isNoteModalOpen} onClose={() => setIsNoteModalOpen(false)} caseId={id} />}

      {isTaskModalOpen && <CreateTaskDialog open={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} caseId={id} />}

      {isEditDialogOpen && caseData && <EditCaseDialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} caseId={id!} caseData={caseData} />}
    </div>;
}