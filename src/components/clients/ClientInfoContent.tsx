
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClientProfile } from './ClientProfile';
import { ClientTabs } from './ClientTabs';
import { ClientQuickActions } from './ClientQuickActions';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ClientInfoContentProps {
  clientId: string;
}

export const ClientInfoContent: React.FC<ClientInfoContentProps> = ({ clientId }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('cases');

  const { data: client, isLoading, error, refetch } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      console.log('Fetching client data for ID:', clientId);
      
      // First fetch the client without the profile join to avoid RLS issues
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientError) {
        console.error('Error fetching client:', clientError);
        throw clientError;
      }

      console.log('Client data fetched:', clientData);

      // If there's an assigned lawyer, fetch their profile separately
      let assignedLawyer = null;
      if (clientData?.assigned_lawyer_id) {
        console.log('Fetching assigned lawyer profile for ID:', clientData.assigned_lawyer_id);
        
        const { data: lawyerData, error: lawyerError } = await supabase
          .from('profiles')
          .select('id, full_name, profile_pic')
          .eq('id', clientData.assigned_lawyer_id)
          .maybeSingle();

        if (lawyerError) {
          console.error('Error fetching lawyer profile:', lawyerError);
          // Don't throw here, just log the error and continue without lawyer data
        } else if (lawyerData) {
          assignedLawyer = lawyerData;
          console.log('Assigned lawyer data fetched:', assignedLawyer);
        }
      }

      // Return the combined data
      return {
        ...clientData,
        assigned_lawyer: assignedLawyer
      };
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-gray-600">Loading client information...</span>
        </div>
      </div>
    );
  }

  if (error || !client) {
    console.error('Client loading error:', error);
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-600 mb-2 text-lg font-medium">Error loading client</div>
            <div className="text-gray-500 mb-4">
              {error?.message || 'Client not found'}
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/clients')}
              className="mx-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Clients
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/clients')}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Clients
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {client.full_name}
              </h1>
              <p className="text-gray-500 mt-1">Client Information & Activity</p>
            </div>
            <ClientQuickActions clientId={clientId} onAction={refetch} />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar: Client Profile */}
          <div className="lg:col-span-1">
            <ClientProfile client={client} onUpdate={refetch} />
          </div>

          {/* Main Content: Activity Tabs */}
          <div className="lg:col-span-3">
            <ClientTabs 
              clientId={clientId} 
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
