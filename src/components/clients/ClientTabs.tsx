
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientOverview } from './ClientOverview';
import { ClientCases } from './ClientCases';
import { ClientAppointments } from './ClientAppointments';
import { ClientDocuments } from './ClientDocuments';
import { ClientNotes } from './ClientNotes';
import { ClientTasks } from './ClientTasks';
import { ClientBilling } from './ClientBilling';
import { ClientEmails } from './ClientEmails';
import { 
  BarChart3, 
  CheckSquare, 
  Calendar, 
  Briefcase, 
  DollarSign, 
  StickyNote, 
  FileText, 
  Mail 
} from 'lucide-react';

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
  // Arrange tab modules in the same style/order as in case detail page where applicable
  const tabs = [
    { value: 'overview-stats', label: 'Overview', icon: BarChart3 },
    { value: 'cases', label: 'Cases', icon: Briefcase },
    { value: 'appointments', label: 'Appointments', icon: Calendar },
    { value: 'documents', label: 'Documents', icon: FileText },
    { value: 'tasks', label: 'Tasks', icon: CheckSquare },
    { value: 'notes', label: 'Notes', icon: StickyNote },
    { value: 'billing', label: 'Billing', icon: DollarSign },
    { value: 'emails', label: 'Emails', icon: Mail },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        {/* Tab Triggers - align style and order to match Case Detail Tabs' placement */}
        <TabsList className="w-full bg-white border-b border-gray-200 rounded-t-2xl h-auto p-0">
          <div className="flex flex-wrap sm:flex-nowrap overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value} 
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-700 data-[state=active]:text-blue-800 data-[state=active]:bg-blue-50 bg-transparent rounded-none whitespace-nowrap transition-colors"
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </div>
        </TabsList>
        {/* Tab Content - consistent padding, layout, card styling */}
        <div className="p-6">
          <TabsContent value="overview-stats" className="m-0">
            <ClientOverview clientId={clientId} />
          </TabsContent>
          <TabsContent value="cases" className="m-0">
            <ClientCases clientId={clientId} />
          </TabsContent>
          <TabsContent value="appointments" className="m-0">
            <ClientAppointments clientId={clientId} />
          </TabsContent>
          <TabsContent value="documents" className="m-0">
            <ClientDocuments clientId={clientId} />
          </TabsContent>
          <TabsContent value="tasks" className="m-0">
            <ClientTasks clientId={clientId} />
          </TabsContent>
          <TabsContent value="notes" className="m-0">
            <ClientNotes clientId={clientId} />
          </TabsContent>
          <TabsContent value="billing" className="m-0">
            <ClientBilling clientId={clientId} />
          </TabsContent>
          <TabsContent value="emails" className="m-0">
            <ClientEmails clientId={clientId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

