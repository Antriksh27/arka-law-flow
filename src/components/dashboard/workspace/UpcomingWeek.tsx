import { Card } from '@/components/ui/card';
import { format, addDays, startOfWeek } from 'date-fns';

interface WeekEvent {
  date: string;
  hearings: number;
  appointments: number;
  tasks: number;
}

interface UpcomingWeekProps {
  events: WeekEvent[];
  isLoading?: boolean;
}

export const UpcomingWeek = ({ events, isLoading }: UpcomingWeekProps) => {
  const getWeekDays = () => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  };

  const weekDays = getWeekDays();

  if (isLoading) {
    return (
      <Card className="p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Upcoming Week</h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  const getEventData = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.find(e => e.date === dateStr) || { hearings: 0, appointments: 0, tasks: 0 };
  };

  const getColorBars = (data: { hearings: number; appointments: number; tasks: number }) => {
    const bars = [];
    if (data.hearings > 0) bars.push(<div key="hearing" className="w-1 h-full bg-red-500 rounded" />);
    if (data.appointments > 0) bars.push(<div key="appt" className="w-1 h-full bg-blue-500 rounded" />);
    if (data.tasks > 0) bars.push(<div key="task" className="w-1 h-full bg-green-500 rounded" />);
    return bars.length > 0 ? bars : <div className="w-1 h-full bg-gray-200 rounded" />;
  };

  return (
    <Card className="p-4 md:p-6 mb-4 md:mb-6">
      <h2 className="text-lg md:text-xl font-semibold mb-4">Upcoming Week</h2>
      
      <div className="space-y-3">
        {weekDays.map((day, index) => {
          const eventData = getEventData(day);
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          
          return (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                isToday ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div>
                <div className="text-xs text-muted-foreground uppercase">
                  {format(day, 'EEE')}
                </div>
                <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : ''}`}>
                  {format(day, 'd')}
                </div>
              </div>
              
              <div className="flex gap-1 h-8">
                {getColorBars(eventData)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded" />
          <span className="text-muted-foreground">Hearings</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span className="text-muted-foreground">Appointments</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-muted-foreground">Tasks</span>
        </div>
      </div>
    </Card>
  );
};
