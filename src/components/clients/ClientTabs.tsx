
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
      <TabsList className="grid w-full grid-cols-4 bg-white rounded-lg border">
        <TabsTrigger value="cases" className="text-sm">Cases</TabsTrigger>
        <TabsTrigger value="appointments" className="text-sm">Appointments</TabsTrigger>
        <TabsTrigger value="documents" className="text-sm">Documents</TabsTrigger>
        <TabsTrigger value="notes" className="text-sm">Notes</TabsTrigger>
      </TabsList>

      <TabsContent value="cases" className="mt-6">
        <ClientCases clientId={clientId} />
      </TabsContent>

      <TabsContent value="appointments" className="mt-6">
        <ClientAppointments clientId={clientId} />
      </TabsContent>

      <TabsContent value="documents" className="mt-6">
        <ClientDocuments clientId={clientId} />
      </TabsContent>

      <TabsContent value="notes" className="mt-6">
        <ClientNotes clientId={clientId} />
      </TabsContent>
    </Tabs>
  );
};
