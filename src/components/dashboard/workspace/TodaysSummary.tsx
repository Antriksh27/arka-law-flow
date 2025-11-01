import { Card } from '@/components/ui/card';
interface Summary {
  hearings: number;
  meetings: number;
  tasks: number;
}
interface TodaysSummaryProps {
  summary: Summary;
  isLoading?: boolean;
}
export const TodaysSummary = ({
  summary,
  isLoading
}: TodaysSummaryProps) => {
  if (isLoading) {
    return <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-800 text-white mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-blue-400 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-blue-400 rounded"></div>
            <div className="h-4 bg-blue-400 rounded"></div>
            <div className="h-4 bg-blue-400 rounded"></div>
          </div>
        </div>
      </Card>;
  }
  return <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-800 text-white mb-6">
      <h2 className="text-xl font-semibold mb-6">Today's Summary</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-white/20">
          <span className="text-sm">Hearings</span>
          <span className="text-3xl font-bold">{summary.hearings}</span>
        </div>
        
        <div className="flex items-center justify-between py-3 border-b border-white/20">
          <span className="text-sm">Meetings</span>
          <span className="text-3xl font-bold">{summary.meetings}</span>
        </div>
        
        <div className="flex items-center justify-between py-3">
          <span className="text-sm">Tasks Pending</span>
          <span className="text-3xl font-bold">{summary.tasks}</span>
        </div>
      </div>

      
    </Card>;
};