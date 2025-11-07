import { Clock, Calendar, CheckSquare, Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TimeUtils } from '@/lib/timeUtils';
import { isToday } from 'date-fns';

interface TimelineEvent {
  id: string;
  type: 'appointment' | 'hearing' | 'task';
  title: string;
  time: string;
  location?: string;
}

interface DailyTimelineProps {
  events: TimelineEvent[];
  isLoading: boolean;
}

export const DailyTimeline = ({ events, isLoading }: DailyTimelineProps) => {
  const getEventIcon = (type: string) => {
    if (type === 'appointment') return <Calendar className="w-4 h-4 text-blue-600" />;
    if (type === 'hearing') return <Scale className="w-4 h-4 text-orange-600" />;
    return <CheckSquare className="w-4 h-4 text-green-600" />;
  };

  const getEventColor = (type: string) => {
    if (type === 'appointment') return 'border-blue-500 bg-blue-50';
    if (type === 'hearing') return 'border-orange-500 bg-orange-50';
    return 'border-green-500 bg-green-50';
  };

  const sortedEvents = [...events].sort((a, b) => {
    return new Date(a.time).getTime() - new Date(b.time).getTime();
  });

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Today's Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No events scheduled for today</p>
            <p className="text-xs text-gray-400 mt-1">Your schedule is clear!</p>
          </div>
        ) : (
          <div className="relative space-y-4">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
            
            {sortedEvents.map((event, index) => (
              <div key={event.id} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className="relative z-10 flex-shrink-0 w-12 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-primary flex items-center justify-center">
                    {getEventIcon(event.type)}
                  </div>
                </div>
                
                {/* Event content */}
                <div className={`flex-1 p-3 rounded-lg border-l-4 ${getEventColor(event.type)} ${index === 0 ? 'mt-0' : ''}`}>
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-medium text-sm">{event.title}</h4>
                    <span className="text-xs font-medium text-gray-600">
                      {TimeUtils.formatTime(event.time)}
                    </span>
                  </div>
                  {event.location && (
                    <p className="text-xs text-gray-600">{event.location}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1 capitalize">{event.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
