
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClientProfile } from './ClientProfile';
import { ClientTabs } from './ClientTabs';
import { ClientQuickActions } from './ClientQuickActions';
import { Loader2 } from 'lucide-react';

interface ClientInfoContentProps {
  clientId: string;
}

export const ClientInfoContent: React.FC<ClientInfoContentProps> = ({ clientId }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('cases');

  const { data: client, isLoading, error, refetch } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          assigned_lawyer:profiles!clients_assigned_lawyer_id_fkey(
            id,
            full_name,
            profile_pic
          )
        `)
        .eq('id', clientId)
        .single();

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading client information...</span>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-600 mb-2">Error loading client</div>
            <div className="text-gray-500">
              {error?.message || 'Client not found'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Quick Actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {client.full_name}
            </h1>
            <p className="text-gray-500 mt-1">Client Information & Activity</p>
          </div>
          <ClientQuickActions clientId={clientId} onAction={refetch} />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Client Profile */}
          <div className="lg:col-span-1">
            <ClientProfile client={client} onUpdate={refetch} />
          </div>

          {/* Right Column: Activity Tabs */}
          <div className="lg:col-span-2">
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
