import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CaseSummarySidebar } from '@/components/cases/detail/CaseSummarySidebar';
import { CaseDetailTabs } from '@/components/cases/detail/CaseDetailTabs';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const CaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('details');
  const queryClient = useQueryClient();

  // Fetch case data from cases table
  const { data: caseData, isLoading: caseLoading } = useQuery({
    queryKey: ['case', id],
    queryFn: async () => {
      if (!id) throw new Error('Case ID is required');
      
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          clients(full_name, email, phone),
          profiles!cases_created_by_fkey(full_name)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Fetch legalkart case data
  const { data: legalkartData, isLoading: legalkartLoading } = useQuery({
    queryKey: ['legalkart-case', id],
    queryFn: async () => {
      if (!id || !caseData?.cnr_number) return null;
      
      const { data, error } = await supabase
        .from('legalkart_cases')
        .select('*')
        .eq('cnr_number', caseData.cnr_number.replace(/[-\s]/g, ''))
        .maybeSingle();
      
      if (error) console.error('Error fetching legalkart data:', error);
      return data;
    },
    enabled: !!id && !!caseData?.cnr_number
  });

  const handleRefreshData = async () => {
    if (!caseData?.cnr_number || !caseData?.court_type) {
      toast.error('CNR number and court type are required to refresh data');
      return;
    }

    try {
      toast.loading('Fetching latest case data...');
      
      const { data, error } = await supabase.functions.invoke('legalkart-api', {
        body: {
          action: 'search',
          cnr: caseData.cnr_number,
          court_type: caseData.court_type
        }
      });

      if (error) throw error;

      // Refresh all queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['case', id] }),
        queryClient.invalidateQueries({ queryKey: ['legalkart-case', id] }),
        queryClient.invalidateQueries({ queryKey: ['case-documents', id] }),
        queryClient.invalidateQueries({ queryKey: ['case-orders', id] }),
        queryClient.invalidateQueries({ queryKey: ['case-hearings', id] })
      ]);

      toast.dismiss();
      toast.success('Case data refreshed successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to refresh case data');
      console.error('Refresh error:', error);
    }
  };

  if (caseLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Case not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            {caseData.vs || caseData.title || 'Case Details'}
          </h1>
          <Button
            onClick={handleRefreshData}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Main Content: 2-Column Layout */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Compact Summary */}
          <div className="lg:col-span-1">
            <CaseSummarySidebar 
              caseData={caseData} 
              legalkartData={legalkartData}
            />
          </div>

          {/* Right: Detailed Tabs */}
          <div className="lg:col-span-3">
            <CaseDetailTabs
              caseId={id!}
              caseData={caseData}
              legalkartData={legalkartData}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetail;
