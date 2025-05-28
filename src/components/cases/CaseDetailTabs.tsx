
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calendar, CheckSquare, StickyNote, MessageSquare, Activity, Filter, Search, Upload, Plus, BarChart3, FileSearch, Clock, Bot } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CaseDocuments } from './CaseDocuments';
import { CaseHearings } from './CaseHearings';
import { CaseTasks } from './CaseTasks';
import { CaseNotes } from './CaseNotes';
import { CaseMessages } from './CaseMessages';
import { CaseActivity } from './CaseActivity';
import { CaseOverview } from './CaseOverview';
import { CaseDetails } from './CaseDetails';
import { CaseTimeline } from './CaseTimeline';
import { CaseResearch } from './CaseResearch';
import { CreateNoteMultiModal } from '../notes/CreateNoteMultiModal';

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
  const [showCreateNoteModal, setShowCreateNoteModal] = useState(false);

  const allTabs = [
    {
      value: 'overview',
      label: 'Overview',
      icon: BarChart3
    },
    {
      value: 'details',
      label: 'Details',
      icon: FileSearch
    },
    {
      value: 'timeline',
      label: 'Timeline',
      icon: Clock
    },
    {
      value: 'research',
      label: 'Research',
      icon: Bot
    },
    {
      value: 'documents',
      label: 'Documents',
      icon: FileText
    },
    {
      value: 'hearings',
      label: 'Hearings',
      icon: Calendar
    },
    {
      value: 'tasks',
      label: 'Tasks',
      icon: CheckSquare
    },
    {
      value: 'notes',
      label: 'Notes',
      icon: StickyNote
    },
    {
      value: 'messages',
      label: 'Messages',
      icon: MessageSquare
    },
    {
      value: 'activity',
      label: 'Activity',
      icon: Activity
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-3">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <Tabs value={activeTab} onValueChange={onTabChange} orientation="vertical" className="flex w-full gap-2 p-6">
            <TabsList className="flex-col gap-1 bg-transparent py-0 w-48">
              {allTabs.map(tab => {
                const IconComponent = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="w-full justify-start gap-2 data-[state=active]:bg-muted data-[state=active]:shadow-none"
                  >
                    <IconComponent className="w-4 h-4" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="grow rounded-lg border border-border">
              <TabsContent value="overview" className="m-0 p-6">
                <CaseOverview caseId={caseId} />
              </TabsContent>

              <TabsContent value="details" className="m-0 p-6">
                <CaseDetails caseId={caseId} />
              </TabsContent>

              <TabsContent value="timeline" className="m-0 p-6">
                <CaseTimeline caseId={caseId} />
              </TabsContent>

              <TabsContent value="research" className="m-0 p-6">
                <CaseResearch caseId={caseId} />
              </TabsContent>

              <TabsContent value="documents" className="m-0 p-6">
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
                  </div>
                  <CaseDocuments caseId={caseId} />
                </div>
              </TabsContent>

              <TabsContent value="hearings" className="m-0 p-6">
                <CaseHearings caseId={caseId} />
              </TabsContent>

              <TabsContent value="tasks" className="m-0 p-6">
                <CaseTasks caseId={caseId} />
              </TabsContent>

              <TabsContent value="notes" className="m-0 p-6">
                <CaseNotes caseId={caseId} />
              </TabsContent>

              <TabsContent value="messages" className="m-0 p-6">
                <CaseMessages caseId={caseId} />
              </TabsContent>

              <TabsContent value="activity" className="m-0 p-6">
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
            <Button className="w-full justify-start">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
            <Button className="w-full justify-start" onClick={() => setShowCreateNoteModal(true)}>
              <StickyNote className="w-4 h-4 mr-2" />
              New Note
            </Button>
            <Button className="w-full justify-start">
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
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Document uploaded</p>
                <p className="text-xs text-gray-500">Added by Priya Sharma • 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Hearing scheduled</p>
                <p className="text-xs text-gray-500">Added by Admin • 4 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateNoteMultiModal open={showCreateNoteModal} onClose={() => setShowCreateNoteModal(false)} caseId={caseId} />
    </div>
  );
};
