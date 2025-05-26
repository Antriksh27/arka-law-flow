
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Calendar, 
  CheckSquare, 
  StickyNote, 
  MessageSquare, 
  Activity,
  BarChart3 
} from 'lucide-react';
import { CaseDocuments } from './CaseDocuments';
import { CaseHearings } from './CaseHearings';
import { CaseTasks } from './CaseTasks';
import { CaseNotes } from './CaseNotes';
import { CaseMessages } from './CaseMessages';
import { CaseActivity } from './CaseActivity';

interface CaseDetailTabsProps {
  caseId: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const CaseDetailTabs: React.FC<CaseDetailTabsProps> = ({ 
  caseId, 
  activeTab, 
  onTabChange 
}) => {
  const tabs = [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'documents', label: 'Documents', icon: FileText },
    { value: 'hearings', label: 'Hearings', icon: Calendar },
    { value: 'tasks', label: 'Tasks', icon: CheckSquare },
    { value: 'notes', label: 'Notes', icon: StickyNote },
    { value: 'messages', label: 'Messages', icon: MessageSquare },
    { value: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="w-full bg-white border-b border-gray-200 rounded-none h-auto p-0">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value} 
                  className="flex items-center gap-2 px-6 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent bg-transparent rounded-none whitespace-nowrap"
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </div>
        </TabsList>

        <div className="p-6">
          <TabsContent value="overview" className="m-0">
            <div className="text-center py-12 text-gray-500">
              Case overview content coming soon
            </div>
          </TabsContent>

          <TabsContent value="documents" className="m-0">
            <CaseDocuments caseId={caseId} />
          </TabsContent>

          <TabsContent value="hearings" className="m-0">
            <CaseHearings caseId={caseId} />
          </TabsContent>

          <TabsContent value="tasks" className="m-0">
            <CaseTasks caseId={caseId} />
          </TabsContent>

          <TabsContent value="notes" className="m-0">
            <CaseNotes caseId={caseId} />
          </TabsContent>

          <TabsContent value="messages" className="m-0">
            <CaseMessages caseId={caseId} />
          </TabsContent>

          <TabsContent value="activity" className="m-0">
            <CaseActivity caseId={caseId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
