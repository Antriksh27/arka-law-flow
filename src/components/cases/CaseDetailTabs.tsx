
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Calendar, 
  CheckSquare, 
  StickyNote, 
  MessageSquare, 
  Activity,
  Filter,
  Search,
  Upload,
  Plus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
    { value: 'documents', label: 'Documents', icon: FileText },
    { value: 'hearings', label: 'Hearings', icon: Calendar },
    { value: 'tasks', label: 'Tasks', icon: CheckSquare },
    { value: 'notes', label: 'Notes', icon: StickyNote },
    { value: 'messages', label: 'Messages', icon: MessageSquare },
    { value: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-3">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            <TabsList className="w-full bg-white border-b border-gray-200 rounded-none h-auto p-0">
              <div className="flex overflow-x-auto w-full">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <TabsTrigger 
                      key={tab.value}
                      value={tab.value} 
                      className="flex items-center gap-2 px-6 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:bg-transparent bg-transparent rounded-none whitespace-nowrap"
                    >
                      <IconComponent className="w-4 h-4" />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </div>
            </TabsList>

            <div className="p-6">
              <TabsContent value="documents" className="m-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input placeholder="Search documents..." className="pl-10 w-64" />
                      </div>
                      <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                      </Button>
                    </div>
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                  <CaseDocuments caseId={caseId} />
                </div>
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
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <StickyNote className="w-4 h-4 mr-2" />
              New Note
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <FileText className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Document uploaded</p>
                <p className="text-xs text-gray-500">Added by Priya Sharma • 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Hearing scheduled</p>
                <p className="text-xs text-gray-500">Added by Admin • 4 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
