import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calendar, CheckSquare, Activity, Info, FolderOpen } from 'lucide-react';
import { CaseHeader } from './CaseHeader';
import { CaseSidebar } from './CaseSidebar';
import { OverviewTab } from './tabs/OverviewTab';
import { DetailsTab } from './tabs/DetailsTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { HearingsTimelineTab } from './tabs/HearingsTimelineTab';
import { TasksNotesTab } from './tabs/TasksNotesTab';
import { CaseActivity } from '../CaseActivity';
import { EditCaseDialog } from '../EditCaseDialog';
import { FetchCaseDialog } from '../FetchCaseDialog';
import { toast } from 'sonner';

interface CaseDetailLayoutProps {
  caseId: string;
  caseData: any;
}

export const CaseDetailLayout: React.FC<CaseDetailLayoutProps> = ({ caseId, caseData }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showFetchDialog, setShowFetchDialog] = useState(false);

  const handleFetchSuccess = (data: any) => {
    toast.success('Case details fetched successfully');
    setShowFetchDialog(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <CaseHeader 
        caseData={caseData}
        onEdit={() => setShowEditDialog(true)}
        onFetchUpdates={() => setShowFetchDialog(true)}
      />

      {/* Main Content with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-gray-100 w-full justify-start">
              <TabsTrigger value="overview">
                <Info className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="details">
                <FileText className="w-4 h-4 mr-2" />
                Details
              </TabsTrigger>
              <TabsTrigger value="documents">
                <FolderOpen className="w-4 h-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="hearings">
                <Calendar className="w-4 h-4 mr-2" />
                Hearings & Timeline
              </TabsTrigger>
              <TabsTrigger value="tasks">
                <CheckSquare className="w-4 h-4 mr-2" />
                Tasks & Notes
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Activity className="w-4 h-4 mr-2" />
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab caseData={caseData} />
            </TabsContent>

            <TabsContent value="details">
              <DetailsTab caseData={caseData} caseId={caseId} />
            </TabsContent>

            <TabsContent value="documents">
              <DocumentsTab caseId={caseId} />
            </TabsContent>

            <TabsContent value="hearings">
              <HearingsTimelineTab caseId={caseId} />
            </TabsContent>

            <TabsContent value="tasks">
              <TasksNotesTab caseId={caseId} />
            </TabsContent>

            <TabsContent value="activity">
              <CaseActivity caseId={caseId} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <CaseSidebar caseId={caseId} />
        </div>
      </div>

      {/* Dialogs */}
      <EditCaseDialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        caseId={caseId}
        caseData={caseData}
      />
      
      <FetchCaseDialog
        open={showFetchDialog}
        onClose={() => setShowFetchDialog(false)}
        onSuccess={handleFetchSuccess}
      />
    </div>
  );
};
