import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calendar, CheckSquare, StickyNote, MessageSquare, Activity, Filter, Search, Plus, BarChart3, FileSearch, Clock, Bot, ExternalLink, Scale, Users, Gavel, History, AlertTriangle, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
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
import { CaseLegalkartIntegration } from './CaseLegalkartIntegration';
import { CreateNoteMultiModal } from '../notes/CreateNoteMultiModal';
import { LegalkartApiDocuments } from './legalkart/LegalkartApiDocuments';
import { LegalkartCaseInfo } from './legalkart/LegalkartCaseInfo';
import { LegalkartParties } from './legalkart/LegalkartParties';
import { LegalkartDocumentsTable } from './legalkart/LegalkartDocumentsTable';
import { LegalkartOrdersTable } from './legalkart/LegalkartOrdersTable';
import { LegalkartHistoryTable } from './legalkart/LegalkartHistoryTable';
import { LegalkartObjectionsTable } from './legalkart/LegalkartObjectionsTable';

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
  const queryClient = useQueryClient();

  const handleCaseDataUpdated = () => {
    // Invalidate and refetch case data and Legalkart data
    queryClient.invalidateQueries({ queryKey: ['case-data', caseId] });
    queryClient.invalidateQueries({ queryKey: ['case-legalkart-data', caseId] });
    queryClient.invalidateQueries({ queryKey: ['case-details-full', caseId] });
    queryClient.invalidateQueries({ queryKey: ['case-detail', caseId] });
  };

  // Fetch latest 3 activities for the sidebar
  const {
    data: recentActivities
  } = useQuery({
    queryKey: ['recent-activities', caseId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('case_activities').select(`
          *,
          profiles!case_activities_created_by_fkey(full_name)
        `).eq('case_id', caseId).order('created_at', {
        ascending: false
      }).limit(3);
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch case data for Legalkart integration
  const {
    data: caseData
  } = useQuery({
    queryKey: ['case-data', caseId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('cases').select('cnr_number, cnr_auto_fetch_enabled, last_fetched_at').eq('id', caseId).single();
      if (error) throw error;
      return data;
    }
  });
  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'case_created': 'Case Created',
      'case_title_changed': 'Title Changed',
      'status_changed': 'Status Updated',
      'priority_changed': 'Priority Changed',
      'client_assigned': 'Client Assignment',
      'assignment_changed': 'Assignment Changed',
      'filing_date_changed': 'Filing Date Updated',
      'next_hearing_changed': 'Next Hearing Updated',
      'description_updated': 'Description Updated',
      'court_changed': 'Court Information',
      'petitioner_changed': 'Petitioner Updated',
      'respondent_changed': 'Respondent Updated',
      'filing_number_changed': 'Filing Number Updated',
      'cnr_number_changed': 'CNR Number Updated',
      'document_uploaded': 'Document Upload',
      'document_deleted': 'Document Deleted',
      'hearing_scheduled': 'Hearing Scheduled',
      'hearing_rescheduled': 'Hearing Rescheduled',
      'hearing_status_changed': 'Hearing Status',
      'task_created': 'Task Created',
      'task_status_changed': 'Task Updated',
      'message_sent': 'Message Sent'
    };
    return labels[type] || 'Activity';
  };

  // Organize tabs into three rows
  const primaryTabs = [{
    value: 'overview',
    label: 'Overview',
    icon: BarChart3
  }, {
    value: 'details',
    label: 'Details',
    icon: FileSearch
  }, {
    value: 'timeline',
    label: 'Timeline',
    icon: Clock
  }, {
    value: 'hearings',
    label: 'Hearings',
    icon: Calendar
  }, {
    value: 'documents',
    label: 'Documents',
    icon: FileText
  }];

  const secondaryTabs = [{
    value: 'legalkart-info',
    label: 'Case Info',
    icon: Info
  }, {
    value: 'legalkart-parties',
    label: 'Parties',
    icon: Users
  }, {
    value: 'legalkart-documents',
    label: 'API Docs',
    icon: FileText
  }, {
    value: 'legalkart-orders',
    label: 'Orders',
    icon: Gavel
  }, {
    value: 'legalkart-history',
    label: 'History',
    icon: History
  }, {
    value: 'legalkart-objections',
    label: 'Objections',
    icon: AlertTriangle
  }];

  const tertiaryTabs = [{
    value: 'tasks',
    label: 'Tasks',
    icon: CheckSquare
  }, {
    value: 'notes',
    label: 'Notes',
    icon: StickyNote
  }, {
    value: 'messages',
    label: 'Messages',
    icon: MessageSquare
  }, {
    value: 'research',
    label: 'Research',
    icon: Bot
  }, {
    value: 'legalkart',
    label: 'API',
    icon: ExternalLink
  }, {
    value: 'activity',
    label: 'Activity',
    icon: Activity
  }];

  return <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-3">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            {/* Three-layer tab navigation */}
            <div className="border-b border-gray-200">
              {/* Primary tabs row - Main Case Data */}
              <div className="flex border-b border-gray-100">
                {primaryTabs.map(tab => {
                const IconComponent = tab.icon;
                return <button key={tab.value} onClick={() => onTabChange(tab.value)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors flex-1 justify-center border-b-2 ${activeTab === tab.value ? 'border-primary text-primary bg-blue-50' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                      <IconComponent className="w-4 h-4" />
                      {tab.label}
                    </button>;
              })}
              </div>
              
              {/* Secondary tabs row - Legalkart API Data */}
              <div className="flex border-b border-gray-100">
                {secondaryTabs.map(tab => {
                const IconComponent = tab.icon;
                return <button key={tab.value} onClick={() => onTabChange(tab.value)} className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors flex-1 justify-center border-b-2 ${activeTab === tab.value ? 'border-primary text-primary bg-blue-50' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                      <IconComponent className="w-3 h-3" />
                      {tab.label}
                    </button>;
              })}
              </div>

              {/* Tertiary tabs row - Additional */}
              <div className="flex">
                {tertiaryTabs.map(tab => {
                const IconComponent = tab.icon;
                return <button key={tab.value} onClick={() => onTabChange(tab.value)} className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors flex-1 justify-center border-b-2 ${activeTab === tab.value ? 'border-primary text-primary bg-blue-50' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                      <IconComponent className="w-3 h-3" />
                      {tab.label}
                    </button>;
              })}
              </div>
            </div>

            <div className="p-6 bg-slate-50">
              <TabsContent value="overview" className="m-0">
                <CaseOverview caseId={caseId} />
              </TabsContent>

              <TabsContent value="details" className="m-0">
                <CaseDetails caseId={caseId} />
              </TabsContent>

              <TabsContent value="timeline" className="m-0">
                <CaseTimeline caseId={caseId} />
              </TabsContent>

              <TabsContent value="hearings" className="m-0">
                <CaseHearings caseId={caseId} />
              </TabsContent>

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
                  </div>
                  <CaseDocuments caseId={caseId} />
                  {/* Legalkart API-sourced documents (opens via iframe) */}
                  <div className="mt-8">
                    <LegalkartApiDocuments caseId={caseId} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="legalkart-info" className="m-0">
                <LegalkartCaseInfo caseId={caseId} />
              </TabsContent>

              <TabsContent value="legalkart-parties" className="m-0">
                <LegalkartParties caseId={caseId} />
              </TabsContent>

              <TabsContent value="legalkart-documents" className="m-0">
                <LegalkartDocumentsTable caseId={caseId} />
              </TabsContent>

              <TabsContent value="legalkart-orders" className="m-0">
                <LegalkartOrdersTable caseId={caseId} />
              </TabsContent>

              <TabsContent value="legalkart-history" className="m-0">
                <LegalkartHistoryTable caseId={caseId} />
              </TabsContent>

              <TabsContent value="legalkart-objections" className="m-0">
                <LegalkartObjectionsTable caseId={caseId} />
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

              <TabsContent value="research" className="m-0">
                <CaseResearch caseId={caseId} />
              </TabsContent>

              <TabsContent value="legalkart" className="m-0">
                <CaseLegalkartIntegration 
                  caseId={caseId}
                  cnrNumber={caseData?.cnr_number}
                  autoFetchEnabled={caseData?.cnr_auto_fetch_enabled}
                  lastFetchedAt={caseData?.last_fetched_at}
                  onCaseDataUpdated={handleCaseDataUpdated}
                />
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
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button 
              className="w-full justify-start"
              onClick={() => onTabChange('tasks')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
            <Button className="w-full justify-start" onClick={() => setShowCreateNoteModal(true)}>
              <StickyNote className="w-4 h-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivities && recentActivities.length > 0 ? recentActivities.map(activity => <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Activity className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{getActivityTypeLabel(activity.activity_type)}</p>
                    <p className="text-xs text-muted">
                      {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
              </div>) : <div className="text-center py-4">
                <p className="text-sm text-muted">No recent activity</p>
              </div>}
          </div>
        </div>
      </div>

      <CreateNoteMultiModal open={showCreateNoteModal} onClose={() => setShowCreateNoteModal(false)} caseId={caseId} />
    </div>;
};
