import { useAuth } from '@/contexts/AuthContext';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { format } from 'date-fns';
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
  const { data, isLoading } = useDashboardData();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const userName = data?.userProfile?.full_name || user?.user_metadata?.full_name || 'User';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold">
                {getGreeting()}, {userName}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(), "EEEE, MMMM d, yyyy • h:mm a")}
              </p>
            </div>
          </div>
          
          <GlobalSearch />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Today's Flow */}
          <div className="lg:col-span-3">
            <TodayFlow 
              events={data?.timelineEvents || []} 
              isLoading={isLoading}
            />
          </div>

          {/* Center Column - My Workspace */}
          <div className="lg:col-span-6">
            <PinnedNotes 
              notes={(data?.myNotes || []).map((n, index) => ({
                id: `note-${index}`,
                title: n.title || '',
                content: n.content || '',
                created_at: n.updated_at || new Date().toISOString(),
              }))} 
              isLoading={isLoading}
            />

            <MyTasks 
              tasks={data?.myTasks || []} 
              isLoading={isLoading}
            />
            
            <MyActiveCases
              cases={(data?.caseHighlights || []).map(c => ({
                ...c,
                client_name: (c as any).client?.full_name || 'Unknown Client',
              }))} 
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
          <div className="lg:col-span-3">
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
              news={[
                {
                  title: 'Supreme Court Ruling on Corporate Liability',
                  source: 'Bar & Bench',
                  time: '2 hours ago',
                  url: 'https://barandbench.com',
                },
                {
                  title: 'New Amendment to Estate Planning Laws',
                  source: 'LiveLaw',
                  time: '5 hours ago',
                  url: 'https://livelaw.in',
                },
                {
                  title: 'District Court Issues Guidelines on Discovery',
                  source: 'Bar & Bench',
                  time: 'Yesterday',
                  url: 'https://barandbench.com',
                },
              ]}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceDashboard;
