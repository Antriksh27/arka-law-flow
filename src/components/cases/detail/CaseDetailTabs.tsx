import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Scale, Calendar, AlertCircle, StickyNote, CheckSquare, Info } from 'lucide-react';
import { CaseDetailsTab } from './tabs/CaseDetailsTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { OrdersTab } from './tabs/OrdersTab';
import { HearingsTab } from './tabs/HearingsTab';
import { ObjectionsTab } from './tabs/ObjectionsTab';
import { NotesTab } from './tabs/NotesTab';
import { TasksTab } from './tabs/TasksTab';

interface CaseDetailTabsProps {
  caseId: string;
  caseData: any;
  legalkartData: any;
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
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="w-full justify-start bg-white border border-gray-200 p-1 rounded-xl">
        <TabsTrigger value="details" className="flex items-center gap-2">
          <Info className="w-4 h-4" />
          Case Details
        </TabsTrigger>
        <TabsTrigger value="documents" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Documents
        </TabsTrigger>
        <TabsTrigger value="orders" className="flex items-center gap-2">
          <Scale className="w-4 h-4" />
          Orders
        </TabsTrigger>
        <TabsTrigger value="hearings" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Hearings
        </TabsTrigger>
        <TabsTrigger value="objections" className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Objections
        </TabsTrigger>
        <TabsTrigger value="notes" className="flex items-center gap-2">
          <StickyNote className="w-4 h-4" />
          Notes
        </TabsTrigger>
        <TabsTrigger value="tasks" className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4" />
          Tasks
        </TabsTrigger>
      </TabsList>

      <div className="mt-6">
        <TabsContent value="details">
          <CaseDetailsTab caseData={caseData} legalkartData={legalkartData} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab caseId={caseId} />
        </TabsContent>

        <TabsContent value="orders">
          <OrdersTab caseId={caseId} />
        </TabsContent>

        <TabsContent value="hearings">
          <HearingsTab caseId={caseId} />
        </TabsContent>

        <TabsContent value="objections">
          <ObjectionsTab caseId={caseId} legalkartData={legalkartData} />
        </TabsContent>

        <TabsContent value="notes">
          <NotesTab caseId={caseId} />
        </TabsContent>

        <TabsContent value="tasks">
          <TasksTab caseId={caseId} />
        </TabsContent>
      </div>
    </Tabs>
  );
};
