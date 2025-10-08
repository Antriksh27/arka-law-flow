import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CaseDetailHeader } from '../components/cases/detail/CaseDetailHeader';
import { CaseDetailTabs } from '../components/cases/detail/CaseDetailTabs';

const CaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('details');

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
      
      // Get client data
      let clientData = null;
      if (caseResult.client_id) {
        const { data: client } = await supabase
          .from('clients')
          .select('full_name')
          .eq('id', caseResult.client_id)
          .maybeSingle();
        
        clientData = client;
      }
      
      // Get creator profile
      let creatorData = null;
      if (caseResult.created_by) {
        const { data: creator } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', caseResult.created_by)
          .maybeSingle();
        
        creatorData = creator;
      }
      
      return {
        ...caseResult,
        clients: clientData,
        profiles: creatorData
      };
    },
    enabled: !!id
  });

  // Fetch Legalkart case data
  const { data: legalkartData } = useQuery({
    queryKey: ['legalkart-case', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data } = await supabase
        .from('legalkart_cases')
        .select('*')
        .eq('case_id', id)
        .maybeSingle();
      
      return data;
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-[1400px] mx-auto space-y-4 animate-pulse">
          <div className="h-16 bg-muted rounded-lg"></div>
          <div className="h-12 bg-muted rounded-lg"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Case not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-lg p-6 space-y-4 shadow-sm">
              <h2 className="text-lg font-bold text-[#1F2937]">Case Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Case Title:</span>
                  <span className="font-semibold text-right">{caseData.vs || caseData.case_title || caseData.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Case Number:</span>
                  <span className="font-semibold text-right">{caseData.case_number || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7280]">Status:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    caseData.status === 'open' ? 'bg-green-100 text-green-800' : 
                    caseData.status === 'closed' ? 'bg-gray-100 text-gray-800' : 
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {caseData.status || 'Open'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Court Name:</span>
                  <span className="font-semibold text-right">{caseData.court || caseData.court_name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Last Updated:</span>
                  <span className="font-semibold">{caseData.updated_at ? new Date(caseData.updated_at).toLocaleDateString() : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Next Hearing:</span>
                  <span className="font-semibold">{caseData.next_hearing_date ? new Date(caseData.next_hearing_date).toLocaleDateString() : '-'}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            <CaseDetailHeader 
              caseData={caseData} 
              legalkartData={legalkartData}
            />
            <CaseDetailTabs 
              caseId={id!} 
              caseData={caseData}
              legalkartData={legalkartData}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CaseDetail;
