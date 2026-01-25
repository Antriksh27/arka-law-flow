import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, FileText, File, Scale, Calendar, XCircle, StickyNote, CheckSquare, Pencil, Users, MoreVertical, Edit } from 'lucide-react';
import { format } from 'date-fns';
import TimeUtils from '@/lib/timeUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EditCaseDialog } from '@/components/cases/EditCaseDialog';
import { MobileHeader } from '@/components/mobile/MobileHeader';

import { HeroCard } from '@/components/mobile/HeroCard';
import { BottomSheet } from '@/components/mobile/BottomSheet';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { useIsMobile } from '@/hooks/use-mobile';
import { MessageSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DetailsTab } from '@/components/cases/detail/tabs/DetailsTab';
import { DocumentsTab } from '@/components/cases/detail/tabs/DocumentsTab';
import { NotesTab } from '@/components/cases/detail/tabs/NotesTab';
import { TasksTab } from '@/components/cases/detail/tabs/TasksTab';
import { ContactTab } from '@/components/cases/detail/tabs/CaseContactsTab';
import { TimelineTab } from '@/components/cases/detail/tabs/TimelineTab';
import { RelatedMattersTab } from '@/components/cases/detail/tabs/RelatedMattersTab';
import { LawyersTab } from '@/components/cases/detail/tabs/LawyersTab';
import { DocumentsTable } from '@/components/cases/enhanced/DocumentsTable';
import { OrdersTable } from '@/components/cases/enhanced/OrdersTable';
import { HearingsTable } from '@/components/cases/enhanced/HearingsTable';
import { ObjectionsTable } from '@/components/cases/enhanced/ObjectionsTable';
import { IADetailsTable } from '@/components/cases/enhanced/IADetailsTable';
import { CreateNoteMultiModal } from '@/components/notes/CreateNoteMultiModal';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { useLegalkartCaseDetails } from '@/hooks/useLegalkartCaseDetails';
import { FetchCaseDetailsDialog } from '@/components/cases/FetchCaseDetailsDialog';
import { SCCaseDetailView } from '@/components/cases/supreme-court/SCCaseDetailView';
import { CaseChatTab } from '@/components/cases/detail/tabs/CaseChatTab';
export default function CaseDetailEnhanced() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'details';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFetchDialogOpen, setIsFetchDialogOpen] = useState(false);
  const [isFetchConfirmOpen, setIsFetchConfirmOpen] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Handle scroll to collapse/expand header
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const scrollTop = scrollContainerRef.current.scrollTop;
      setIsHeaderCollapsed(scrollTop > 50);
    }
  }, []);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Sync active tab with URL query parameter
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Fetch case data
  const {
    data: caseData,
    isLoading: caseLoading
  } = useQuery({
    queryKey: ['case', id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('cases').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Fetch client data if case has a client
  const {
    data: clientData,
    isLoading: clientLoading
  } = useQuery({
    queryKey: ['client', caseData?.client_id],
    queryFn: async () => {
      if (!caseData?.client_id) return null;
      const {
        data,
        error
      } = await supabase.from('clients').select('id, full_name').eq('id', caseData.client_id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!caseData?.client_id
  });

  // Fetch main contact for this case
  const {
    data: mainContact
  } = useQuery({
    queryKey: ['main-contact', id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('case_contacts').select('*').eq('case_id', id as string).eq('is_main', true).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Fetch last hearing for this case
  const {
    data: lastHearing
  } = useQuery({
    queryKey: ['last-hearing', id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const {
        data,
        error
      } = await supabase
        .from('case_hearings')
        .select('hearing_date')
        .eq('case_id', id as string)
        .lt('hearing_date', today)
        .order('hearing_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Unified LegalKart/eCourt data via hook
  const {
    legalkartCase,
    petitioners = [],
    respondents = [],
    iaDetails = [],
    documents = [],
    orders = [],
    objections = [],
    hearings = [],
    isLoading: legalkartLoading,
    refreshCaseData,
    isRefreshing
  } = useLegalkartCaseDetails(id!);

  // Handler for Fetch Details button
  const handleFetchDetails = async () => {
    setIsFetchConfirmOpen(true);
  };

  const confirmFetchDetails = async () => {
    if (!caseData?.cnr_number) {
      // No CNR - show dialog to input CNR
      setIsFetchDialogOpen(true);
    } else {
      // CNR exists - directly refresh
      await refreshCaseData();
    }
    setIsFetchConfirmOpen(false);
  };

  const getDisplayStatus = () => {
    const isLinked = caseData?.cnr_number && caseData?.last_fetched_at;
    if (isLinked) {
      const statusLower = (caseData?.status || '').toLowerCase();
      if (statusLower.includes('disposed') || statusLower.includes('dismiss') || 
          statusLower.includes('withdraw') || statusLower.includes('settled')) {
        return { label: 'Disposed', color: 'bg-purple-100 text-purple-700' };
      }
      return { label: 'In Court', color: 'bg-yellow-100 text-yellow-700' };
    }
    return { label: 'Open', color: 'bg-blue-100 text-blue-700' };
  };

  const displayStatus = getDisplayStatus();

  // Refresh handled by useLegalkartCaseDetails.refreshCaseData
  const tabs = [{
    value: 'details',
    label: 'Details',
    icon: FileText
  }, {
    value: 'contacts',
    label: 'Contacts',
    icon: File
  }, {
    value: 'notes',
    label: 'Notes',
    icon: StickyNote
  }, {
    value: 'tasks',
    label: 'Tasks',
    icon: CheckSquare
  }, {
    value: 'documents',
    label: 'Documents',
    icon: File
  }, {
    value: 'chat',
    label: 'Chat',
    icon: MessageSquare
  }, {
    value: 'timeline',
    label: 'Timeline',
    icon: Calendar
  }, {
    value: 'lawyers',
    label: 'Lawyers',
    icon: Users
  }, {
    value: 'related',
    label: 'Related Matters',
    icon: Scale
  }];
  // Mobile Loading State
  if ((caseLoading || legalkartLoading) && isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title="Loading..." showBack backTo="/cases" />
        <div className="p-4 space-y-4">
          {/* Hero Card skeleton */}
          <Skeleton className="h-40 w-full rounded-2xl" />
          
          {/* Tabs skeleton */}
          <Skeleton className="h-12 w-full rounded-xl" />
          
          {/* Content skeleton */}
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // Desktop Loading State
  if (caseLoading || legalkartLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-8 space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // Mobile Error/Not Found State
  if (!caseData && isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title="Case" showBack backTo="/cases" />
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Scale className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">Case not found</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            This case may have been deleted or you don't have access.
          </p>
          <Button onClick={() => navigate('/cases')} className="min-h-[48px]">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Desktop Error/Not Found State
  if (!caseData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="text-center py-12">
          <p className="text-gray-500">Case not found</p>
        </div>
      </div>
    );
  }

  // Detect Supreme Court cases
  const isSupremeCourt = Boolean(
    caseData.court === 'Supreme Court of India' ||
    caseData.court_name === 'Supreme Court of India' ||
    caseData.cnr_number?.startsWith('SCIN') ||
    caseData.court_type === 'supreme_court'
  );

  // Render Supreme Court specific view
  if (isSupremeCourt) {
    return (
      <div className="min-h-screen bg-gray-50">
        {isMobile && (
          <MobileHeader
            title="Supreme Court Case"
            showBack
            backTo="/cases"
          />
        )}
        <div className={isMobile ? 'p-4 pb-24' : 'p-8'}>
          <SCCaseDetailView 
            caseId={id!} 
            caseNumber={caseData.cnr_number}
            caseData={caseData}
            onEdit={() => setIsEditDialogOpen(true)}
            onFetchDetails={handleFetchDetails}
            isRefreshing={isRefreshing}
            isMobile={isMobile}
            onAddNote={() => setIsNoteModalOpen(true)}
            onAddTask={() => setIsTaskModalOpen(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Header */}
      {isMobile && (
        <MobileHeader
          title="Case Detail"
          showBack
          backTo="/cases"
          actions={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Case
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleFetchDetails} disabled={isRefreshing}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Fetch Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsNoteModalOpen(true)}>
                  <StickyNote className="w-4 h-4 mr-2" />
                  Add Note
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsTaskModalOpen(true)}>
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Add Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
      )}

      <div className={isMobile ? "flex flex-col h-[calc(100vh-56px)]" : undefined}>
        {/* Mobile Layout */}
        {isMobile && (
          <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50">
            {/* Hero Card - scrolls with content */}
            <div className="p-4">
              <HeroCard
                title={caseData.case_title || `${caseData.petitioner || 'Petitioner'} vs ${caseData.respondent || 'Respondent'}`}
                subtitle={`CNR: ${caseData.cnr_number || 'N/A'}`}
                badges={
                  <>
                    <Badge className={`${displayStatus.color} rounded-full`}>
                      {displayStatus.label}
                    </Badge>
                    {caseData.stage && (
                      <Badge variant="outline" className="rounded-full">
                        {caseData.stage}
                      </Badge>
                    )}
                  </>
                }
                metrics={[
                  { label: 'Documents', value: documents.length },
                  { label: 'Hearings', value: hearings.length },
                  { label: 'Tasks', value: 0 },
                ]}
              />
            </div>

            {/* Tabs - sticky below hero card */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
              <div className="sticky top-0 z-40 bg-background border-b border-border">
                <div className="flex overflow-x-auto scrollbar-hide px-4">
                  {tabs.map(tab => {
                    const IconComponent = tab.icon;
                    return (
                      <button 
                        key={tab.value} 
                        onClick={() => setActiveTab(tab.value)}
                        className={`flex items-center gap-2 px-4 py-3 min-h-[48px] text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex-shrink-0 ${
                          activeTab === tab.value 
                            ? 'border-primary text-primary' 
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        {tab.label.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Content */}
              <div className="px-4 py-4 pb-24">
                <TabsContent value="details" className="m-0">
                  <DetailsTab caseData={caseData} legalkartData={legalkartCase} petitioners={petitioners} respondents={respondents} iaDetails={iaDetails} documents={documents} orders={orders} hearings={hearings} objections={objections} />
                </TabsContent>
                <TabsContent value="contacts" className="m-0">
                  <ContactTab caseId={id!} />
                </TabsContent>
                <TabsContent value="notes" className="m-0">
                  <NotesTab caseId={id!} />
                </TabsContent>
                <TabsContent value="tasks" className="m-0">
                  <TasksTab caseId={id!} />
                </TabsContent>
                <TabsContent value="documents" className="m-0">
                  <DocumentsTab caseId={id!} />
                </TabsContent>
                <TabsContent value="chat" className="m-0">
                  <CaseChatTab caseId={id!} />
                </TabsContent>
                <TabsContent value="timeline" className="m-0">
                  <TimelineTab caseId={id!} caseData={caseData} legalkartData={legalkartCase} hearings={hearings} />
                </TabsContent>
                <TabsContent value="lawyers" className="m-0">
                  <LawyersTab caseId={id!} />
                </TabsContent>
                <TabsContent value="related" className="m-0">
                  <RelatedMattersTab caseId={id!} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}

        {/* Desktop Layout */}
        {!isMobile && (
        <PullToRefresh onRefresh={handleFetchDetails}>
          <div className="bg-gray-50 min-h-screen pb-8">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm m-8">
            {/* Tabs with integrated header */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Header section integrated with tabs - Desktop only */}
                <div className="p-6 pb-0">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                        {caseData.case_title || `${caseData.petitioner || 'Petitioner'} vs ${caseData.respondent || 'Respondent'}`}
                      </h1>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">CNR:</span> {caseData.cnr_number || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Registration No:</span> {caseData.registration_number || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Filing No:</span> {legalkartCase?.filing_number || caseData.filing_number || 'N/A'}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Reference No:</span> {caseData.reference_number || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Last Hearing:</span> {lastHearing?.hearing_date ? TimeUtils.formatDate(lastHearing.hearing_date, 'dd/MM/yyyy') : 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Next Hearing:</span> {caseData.next_hearing_date ? TimeUtils.formatDate(caseData.next_hearing_date, 'dd/MM/yyyy') : 'N/A'}
                    </div>
                    {clientData && <div>
                        <span className="font-medium">Client:</span>{' '}
                        <Link to={`/clients/${clientData.id}`} className="text-blue-700 hover:text-blue-800 hover:underline">
                          {clientData.full_name}
                        </Link>
                      </div>}
                  </div>
                  {mainContact && <div className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Contact:</span> {mainContact.name}
                      {mainContact.phone && <span className="ml-1">({mainContact.phone})</span>}
                    </div>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleFetchDetails}
                        disabled={isRefreshing}
                      >
                        {isRefreshing ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Fetching...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Fetch Details
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

              {/* Horizontal Scroll Tabs */}
              <TabsList className="w-full bg-background border-b border-border h-auto p-0">
                <div className="flex overflow-x-auto scrollbar-hide">
                  {tabs.map(tab => {
                    const IconComponent = tab.icon;
                    return (
                      <TabsTrigger 
                        key={tab.value} 
                        value={tab.value} 
                        className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent rounded-none whitespace-nowrap transition-colors flex-shrink-0"
                      >
                        <IconComponent className="w-4 h-4" />
                        {tab.label}
                      </TabsTrigger>
                    );
                  })}
                </div>
              </TabsList>

              <div className="p-6">
                <TabsContent value="details" className="m-0">
                  <DetailsTab caseData={caseData} legalkartData={legalkartCase} petitioners={petitioners} respondents={respondents} iaDetails={iaDetails} documents={documents} orders={orders} hearings={hearings} objections={objections} />
                </TabsContent>
                <TabsContent value="contacts" className="m-0">
                  <ContactTab caseId={id!} />
                </TabsContent>
                <TabsContent value="notes" className="m-0">
                  <NotesTab caseId={id!} />
                </TabsContent>
                <TabsContent value="tasks" className="m-0">
                  <TasksTab caseId={id!} />
                </TabsContent>
                <TabsContent value="documents" className="m-0">
                  <DocumentsTab caseId={id!} />
                </TabsContent>
                <TabsContent value="chat" className="m-0">
                  <CaseChatTab caseId={id!} />
                </TabsContent>
                <TabsContent value="timeline" className="m-0">
                  <TimelineTab caseId={id!} caseData={caseData} legalkartData={legalkartCase} hearings={hearings} />
                </TabsContent>
                <TabsContent value="lawyers" className="m-0">
                  <LawyersTab caseId={id!} />
                </TabsContent>
                <TabsContent value="related" className="m-0">
                  <RelatedMattersTab caseId={id!} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
          </div>
        </PullToRefresh>
        )}
      </div>


      {/* Modals */}
      {isNoteModalOpen && <CreateNoteMultiModal open={isNoteModalOpen} onClose={() => setIsNoteModalOpen(false)} caseId={id} />}

      {isTaskModalOpen && <CreateTaskDialog open={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} caseId={id} />}

      {isEditDialogOpen && caseData && <EditCaseDialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} caseId={id!} caseData={caseData} />}

      {isFetchDialogOpen && (
        <FetchCaseDetailsDialog
          open={isFetchDialogOpen}
          onClose={() => setIsFetchDialogOpen(false)}
          caseId={id!}
          onFetchTriggered={() => {
            setIsFetchDialogOpen(false);
            refreshCaseData();
          }}
        />
      )}

      <AlertDialog open={isFetchConfirmOpen} onOpenChange={setIsFetchConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fetch Case Details</AlertDialogTitle>
            <AlertDialogDescription>
              This will fetch the latest case details from eCourts. Any existing data will be updated. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmFetchDetails}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}