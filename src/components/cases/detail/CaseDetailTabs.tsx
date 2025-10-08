import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DetailsTab } from './tabs/DetailsTab';
import { ContactTab } from './tabs/ContactTab';
import { NotesTab } from './tabs/NotesTab';
import { TasksTab } from './tabs/TasksTab';
import { DocumentsTab } from './tabs/DocumentsTab';

interface CaseDetailTabsProps {
  caseId: string;
  caseData: any;
  legalkartData?: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const CaseDetailTabs: React.FC<CaseDetailTabsProps> = ({
  caseId,
  caseData,
  legalkartData,
  activeTab,
  onTabChange
}) => {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none">
          <TabsTrigger 
            value="details" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            Details
          </TabsTrigger>
          <TabsTrigger 
            value="contact" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            Contact
          </TabsTrigger>
          <TabsTrigger 
            value="notes" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            Notes
          </TabsTrigger>
          <TabsTrigger 
            value="tasks" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            Tasks
          </TabsTrigger>
          <TabsTrigger 
            value="documents" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            Documents
          </TabsTrigger>
        </TabsList>

        <div className="p-6">
          <TabsContent value="details" className="mt-0">
            <DetailsTab 
              caseData={caseData} 
              legalkartData={legalkartData}
              caseId={caseId}
            />
          </TabsContent>

          <TabsContent value="contact" className="mt-0">
            <ContactTab caseData={caseData} />
          </TabsContent>

          <TabsContent value="notes" className="mt-0">
            <NotesTab caseId={caseId} />
          </TabsContent>

          <TabsContent value="tasks" className="mt-0">
            <TasksTab caseId={caseId} />
          </TabsContent>

          <TabsContent value="documents" className="mt-0">
            <DocumentsTab caseId={caseId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
