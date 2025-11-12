import { useAuth } from '@/contexts/AuthContext';
import { useDashboardDataOptimized } from '@/hooks/use-dashboard-data-optimized';
import { TimeUtils } from '@/lib/timeUtils';
import { TodayFlow } from './workspace/TodayFlow';
import { PinnedNotes } from './workspace/PinnedNotes';
import { MyActiveCases } from './workspace/MyActiveCases';
import { RecentDocuments } from './workspace/RecentDocuments';
import { RecentChats } from './workspace/RecentChats';
import { TodaysSummary } from './workspace/TodaysSummary';
import { UpcomingWeek } from './workspace/UpcomingWeek';
import { QuickActions } from './workspace/QuickActions';
import { LegalUpdates } from './workspace/LegalUpdates';
import { GlobalSearch } from './GlobalSearch';
import { MyTasks } from './workspace/MyTasks';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavBar } from '@/components/mobile/BottomNavBar';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { DashboardHeroStats } from './workspace/DashboardHeroStats';
import { DashboardMobileFAB } from './DashboardMobileFAB';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { Bell, User } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

const WorkspaceDashboard = () => {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardDataOptimized();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('today');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const userName = data?.userProfile?.full_name || user?.user_metadata?.full_name || 'User';

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
  };

  // Calculate metrics for hero stats
  const activeCases = (data?.caseHighlights || []).length;
  const todayEvents = (data?.timelineEvents || []).filter(e => e.type === 'hearing' || e.type === 'appointment').length;
  const pendingTasks = (data?.myTasks || []).filter(t => t.status !== 'completed').length;
  const weekEvents = (data?.weekEvents || []).length;

  return (
    <>
      {/* Mobile Header */}
      {isMobile && (
        <MobileHeader
          title={`${getGreeting()}, ${userName.split(' ')[0]}`}
          actions={
            <>
              <button className="p-2 rounded-lg hover:bg-accent/50 active:scale-95 transition-all">
                <Bell className="w-5 h-5 text-foreground" />
              </button>
              <button 
                onClick={() => navigate('/team')}
                className="p-2 rounded-lg hover:bg-accent/50 active:scale-95 transition-all"
              >
                <User className="w-5 h-5 text-foreground" />
              </button>
            </>
          }
        />
      )}

      <PullToRefresh onRefresh={handleRefresh}>
        <div className={`bg-gray-50 overflow-x-hidden ${isMobile ? 'pb-24' : 'min-h-screen'}`}>
          {/* Desktop Header */}
          {!isMobile && (
            <div className="bg-white border-b border-gray-200 px-4 py-3 md:px-8 md:py-6">
              <div className="max-w-[1800px] mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-4 gap-2">
                  <div className="flex flex-col md:min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h1 className="text-2xl font-semibold">
                        {getGreeting()}, {userName}
                      </h1>
                      <p className="text-sm text-muted-foreground">
                        {TimeUtils.formatDateTime(new Date(), "EEEE, MMMM d, yyyy • h:mm a")}
                      </p>
                    </div>
                  </div>
                </div>
                
                <GlobalSearch />
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="max-w-[1800px] mx-auto px-3 py-3 md:px-8 md:py-6 w-full">
            {/* Mobile Hero Stats */}
            {isMobile && (
              <div className="mb-4">
                <DashboardHeroStats
                  activeCases={activeCases}
                  todayEvents={todayEvents}
                  pendingTasks={pendingTasks}
                  weekEvents={weekEvents}
                  isLoading={isLoading}
                />
              </div>
            )}

            {/* Mobile: Global Search */}
            {isMobile && (
              <div className="mb-4">
                <GlobalSearch />
              </div>
            )}

            {/* Mobile: Tabbed Interface */}
            {isMobile ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-4 mb-4">
                  <TabsTrigger value="today" className="text-xs">Today</TabsTrigger>
                  <TabsTrigger value="cases" className="text-xs">Cases</TabsTrigger>
                  <TabsTrigger value="tasks" className="text-xs">Tasks</TabsTrigger>
                  <TabsTrigger value="updates" className="text-xs">Updates</TabsTrigger>
                </TabsList>

                <TabsContent value="today" className="mt-0 space-y-4">
                  <TodaysSummary 
                    summary={{
                      hearings: (data?.timelineEvents || []).filter(e => e.type === 'hearing').length,
                      meetings: (data?.timelineEvents || []).filter(e => e.type === 'appointment').length,
                      tasks: (data?.timelineEvents || []).filter(e => e.type === 'task').length,
                    }}
                    isLoading={isLoading}
                  />
                  <TodayFlow 
                    events={data?.timelineEvents || []} 
                    isLoading={isLoading}
                  />
                  <UpcomingWeek 
                    events={data?.weekEvents || []} 
                    isLoading={isLoading}
                  />
                </TabsContent>

                <TabsContent value="cases" className="mt-0">
                  <MyActiveCases
                    cases={(data?.caseHighlights || []).map(c => ({
                      ...c,
                      client_name: (c as any).client?.full_name || 'Unknown Client',
                    }))} 
                    isLoading={isLoading}
                  />
                </TabsContent>

                <TabsContent value="tasks" className="mt-0 space-y-4">
                  <MyTasks 
                    tasks={data?.myTasks || []} 
                    isLoading={isLoading}
                  />
                  <PinnedNotes 
                    notes={(data?.myNotes || []).map((n) => ({
                      id: n.id,
                      title: n.title || '',
                      content: n.content || '',
                      created_at: n.created_at || new Date().toISOString(),
                      color: n.color || undefined,
                    }))} 
                    isLoading={isLoading}
                  />
                </TabsContent>

                <TabsContent value="updates" className="mt-0 space-y-4">
                  <RecentDocuments 
                    documents={(data?.recentDocuments || []).map(d => ({
                      id: d.id,
                      file_name: d.name || d.file_name || 'Document',
                      case_title: (d as any).case?.case_title || 'General',
                      uploaded_at: d.created_at,
                      file_type: d.file_type,
                    }))} 
                    isLoading={isLoading}
                  />
                  <LegalUpdates 
                    news={data?.legalNews || []}
                    isLoading={isLoading}
                  />
                  <RecentChats 
                    isLoading={isLoading}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              /* Desktop: 3-Column Grid */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
                {/* Left Column - Today's Flow */}
                <div className="lg:col-span-3 order-2 lg:order-none">
                  <TodayFlow 
                    events={data?.timelineEvents || []} 
                    isLoading={isLoading}
                  />
                </div>

                {/* Center Column - My Workspace */}
                <div className="lg:col-span-6 order-3 lg:order-none">
                  <MyActiveCases
                    cases={(data?.caseHighlights || []).map(c => ({
                      ...c,
                      client_name: (c as any).client?.full_name || 'Unknown Client',
                    }))} 
                    isLoading={isLoading}
                  />

                  <PinnedNotes 
                    notes={(data?.myNotes || []).map((n) => ({
                      id: n.id,
                      title: n.title || '',
                      content: n.content || '',
                      created_at: n.created_at || new Date().toISOString(),
                      color: n.color || undefined,
                    }))} 
                    isLoading={isLoading}
                  />

                  <MyTasks 
                    tasks={data?.myTasks || []} 
                    isLoading={isLoading}
                  />
                  
                  <RecentDocuments 
                    documents={(data?.recentDocuments || []).map(d => ({
                      id: d.id,
                      file_name: d.name || d.file_name || 'Document',
                      case_title: (d as any).case?.case_title || 'General',
                      uploaded_at: d.created_at,
                      file_type: d.file_type,
                    }))} 
                    isLoading={isLoading}
                  />
                  
                  <RecentChats 
                    isLoading={isLoading}
                  />
                </div>

                {/* Right Column - Insights & Tools */}
                <div className="lg:col-span-3 order-1 lg:order-none">
                  <TodaysSummary 
                    summary={{
                      hearings: (data?.timelineEvents || []).filter(e => e.type === 'hearing').length,
                      meetings: (data?.timelineEvents || []).filter(e => e.type === 'appointment').length,
                      tasks: (data?.timelineEvents || []).filter(e => e.type === 'task').length,
                    }}
                    isLoading={isLoading}
                  />
                  
                  <UpcomingWeek 
                    events={data?.weekEvents || []} 
                    isLoading={isLoading}
                  />
                  
                  <QuickActions />
                  
                  <LegalUpdates 
                    news={data?.legalNews || []}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </PullToRefresh>

      {/* Mobile FAB */}
      {isMobile && <DashboardMobileFAB />}

      {/* Mobile Bottom Nav */}
      {isMobile && <BottomNavBar />}
    </>
  );
};

export default WorkspaceDashboard;
