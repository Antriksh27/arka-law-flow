
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientCases } from './ClientCases';
import { ClientAppointments } from './ClientAppointments';
import { ClientDocuments } from './ClientDocuments';
import { ClientNotes } from './ClientNotes';

interface ClientTabsProps {
  clientId: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const ClientTabs: React.FC<ClientTabsProps> = ({ 
  clientId, 
  activeTab, 
  onTabChange 
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-white rounded-xl border border-gray-200 p-1">
        <TabsTrigger 
          value="cases" 
          className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white"
        >
          Cases
        </TabsTrigger>
        <TabsTrigger 
          value="appointments" 
          className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white"
        >
          Appointments
        </TabsTrigger>
        <TabsTrigger 
          value="documents" 
          className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white"
        >
          Documents
        </TabsTrigger>
        <TabsTrigger 
          value="notes" 
          className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white"
        >
          Notes
        </TabsTrigger>
      </TabsList>

      <div className="mt-6">
        <TabsContent value="cases" className="m-0">
          <ClientCases clientId={clientId} />
        </TabsContent>

        <TabsContent value="appointments" className="m-0">
          <ClientAppointments clientId={clientId} />
        </TabsContent>

        <TabsContent value="documents" className="m-0">
          <ClientDocuments clientId={clientId} />
        </TabsContent>

        <TabsContent value="notes" className="m-0">
          <ClientNotes clientId={clientId} />
        </TabsContent>
      </div>
    </Tabs>
  );
};
