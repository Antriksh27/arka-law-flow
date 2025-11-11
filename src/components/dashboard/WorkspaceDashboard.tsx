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

const WorkspaceDashboard = () => {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardDataOptimized();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const userName = data?.userProfile?.full_name || user?.user_metadata?.full_name || 'User';

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 md:px-8 md:py-6">
        <div className="max-w-[1800px] mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-4 gap-2">
            {/* Mobile: Single line layout */}
            <div className="flex flex-col md:min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h1 className="text-lg md:text-2xl font-semibold">
                  {getGreeting()}, {userName}
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  <span className="md:hidden">
                    {TimeUtils.formatDateTime(new Date(), "MMM d • h:mm a")}
                  </span>
                  <span className="hidden md:inline">
                    {TimeUtils.formatDateTime(new Date(), "EEEE, MMMM d, yyyy • h:mm a")}
                  </span>
                </p>
              </div>
            </div>
          </div>
          
          <GlobalSearch />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-4 py-4 md:px-8 md:py-6 w-full">
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
      </div>
    </div>
  );
};

export default WorkspaceDashboard;
