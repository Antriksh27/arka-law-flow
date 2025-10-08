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
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
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
  );
};

export default CaseDetail;
