
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CaseDetailHeader } from '../components/cases/CaseDetailHeader';
import { CaseDetailTabs } from '../components/cases/CaseDetailTabs';

const CaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: caseData, isLoading } = useQuery({
    queryKey: ['case-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Case ID is required');
      
      // First get the case data
      const { data: caseResult, error: caseError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', id)
        .single();
      
      if (caseError) throw caseError;
      
      // Then get client data separately if client_id exists
      let clientData = null;
      if (caseResult.client_id) {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('full_name')
          .eq('id', caseResult.client_id)
          .single();
        
        if (!clientError && client) {
          clientData = client;
        }
      }
      
      // Get creator profile separately if created_by exists
      let creatorData = null;
      if (caseResult.created_by) {
        const { data: creator, error: creatorError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', caseResult.created_by)
          .single();
        
        if (!creatorError && creator) {
          creatorData = creator;
        }
      }
      
      return {
        ...caseResult,
        clients: clientData,
        profiles: creatorData
      };
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="animate-pulse p-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Case not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <CaseDetailHeader case={caseData} />
      <CaseDetailTabs 
        caseId={id!} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  );
};

export default CaseDetail;

