
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '../components/layout/DashboardLayout';
import { CaseDetailHeader } from '../components/cases/CaseDetailHeader';
import { CaseDetailTabs } from '../components/cases/CaseDetailTabs';

const CaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: caseData, isLoading } = useQuery({
    queryKey: ['case-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Case ID is required');
      
      const { data, error } = await supabase
        .from('case_details')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse p-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
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
      <div className="space-y-6 p-6">
        <CaseDetailHeader case={caseData} />
        <CaseDetailTabs 
          caseId={id!} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      </div>
    </DashboardLayout>
  );
};

export default CaseDetail;
