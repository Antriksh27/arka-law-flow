import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClientTabs } from './ClientTabs';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ClientInfoContentProps {
  clientId: string;
}

export const ClientInfoContent: React.FC<ClientInfoContentProps> = ({
  clientId
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview-stats');

  const {
    data: client,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      console.log('🔍 Fetching client data for ID:', clientId);
      const {
        data: clientData,
        error: clientError
      } = await supabase.from('clients').select('*').eq('id', clientId).single();
      if (clientError) {
        console.error('❌ Error fetching client:', clientError);
        throw clientError;
      }
      console.log('✅ Client data fetched:', clientData);
      return clientData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false
  });

  console.log('🔄 ClientInfoContent render - isLoading:', isLoading, 'client:', !!client, 'error:', !!error);

  if (isLoading) {
    console.log('⏳ Showing loading state for client:', clientId);
    return <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-gray-600">Loading client information...</span>
        </div>
      </div>;
  }

  if (error || !client) {
    console.error('❌ Client loading error:', error);
    console.log('🚫 Showing error state - error:', error?.message, 'client:', !!client);
    return <div className="min-h-[calc(100vh-64px)] bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-600 mb-2 text-lg font-medium">Error loading client</div>
            <div className="text-gray-500 mb-4">
              {error?.message || 'Client not found'}
            </div>
            <Button variant="outline" onClick={() => navigate('/clients')} className="mx-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Clients
            </Button>
          </div>
        </div>
      </div>;
  }

  console.log('✅ Rendering client content:', { 
    clientId, 
    clientName: client.full_name, 
    status: client.status,
    hasReferredBy: !!client.referred_by_name 
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Single unified container - matching CaseDetailEnhanced pattern */}
      <ClientTabs 
        clientId={clientId} 
        client={client}
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onUpdate={refetch}
      />
    </div>
  );
};
