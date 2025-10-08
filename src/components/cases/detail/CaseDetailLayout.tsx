import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, CheckSquare, Activity, Info, FolderOpen, StickyNote } from 'lucide-react';
import { CaseHeader } from './CaseHeader';
import { OverviewTab } from './tabs/OverviewTab';
import { DetailsTab } from './tabs/DetailsTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { TasksTab } from './tabs/TasksTab';
import { NotesTab } from './tabs/NotesTab';
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

      {/* Main Content */}
      <div className="w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted w-full justify-start">
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
            <TabsTrigger value="tasks">
              <CheckSquare className="w-4 h-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="notes">
              <StickyNote className="w-4 h-4 mr-2" />
              Notes
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

          <TabsContent value="tasks">
            <TasksTab caseId={caseId} />
          </TabsContent>

          <TabsContent value="notes">
            <NotesTab caseId={caseId} />
          </TabsContent>

          <TabsContent value="activity">
            <CaseActivity caseId={caseId} />
          </TabsContent>
        </Tabs>
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
