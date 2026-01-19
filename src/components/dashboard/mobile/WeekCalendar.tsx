import React from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';

interface DayEvent {
  date: Date;
  count: number;
  types: string[]; // 'hearing', 'appointment', 'task'
}

interface WeekCalendarProps {
  events: DayEvent[];
  isLoading?: boolean;
}

export const WeekCalendar: React.FC<WeekCalendarProps> = ({ events, isLoading }) => {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getEventDots = (date: Date) => {
    const dayEvents = events.find((e) => isSameDay(e.date, date));
    if (!dayEvents || dayEvents.count === 0) return null;

    const colors = {
      hearing: 'bg-red-500',
      appointment: 'bg-blue-500',
      task: 'bg-green-500',
    };

    // Get unique event types for this day
    const uniqueTypes = [...new Set(dayEvents.types)].slice(0, 3);

    return (
      <div className="flex gap-1 justify-center mt-2 min-h-[8px]">
        {uniqueTypes.map((type, idx) => (
          <div key={idx} className={`w-2 h-2 rounded-full ${colors[type as keyof typeof colors] || 'bg-slate-400'}`} />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <section className="mb-6">
        <h2 className="text-base font-semibold text-foreground mb-3">Weekly Overview</h2>
        <div className="bg-white rounded-2xl p-4 animate-pulse shadow-sm">
          <div className="flex justify-between mb-4">
            {weekDays.map((_, i) => (
              <div key={i} className="flex flex-col items-center flex-1">
                <div className="h-3 bg-slate-100 rounded w-6 mb-2" />
                <div className="h-9 w-9 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-4 pt-3 border-t border-slate-100">
            <div className="h-4 bg-slate-100 rounded w-16" />
            <div className="h-4 bg-slate-100 rounded w-16" />
            <div className="h-4 bg-slate-100 rounded w-16" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold text-foreground mb-3">Weekly Overview</h2>
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex justify-between mb-2">
          {weekDays.map((day, index) => {
            const isToday = isSameDay(day, today);
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <span className="text-xs text-muted-foreground mb-1.5 font-medium">
                  {format(day, 'EEE')}
                </span>
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    isToday
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground'
                  }`}
                >
                  {format(day, 'd')}
                </div>
                {getEventDots(day)}
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
            <span className="text-muted-foreground font-medium">Hearings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <span className="text-muted-foreground font-medium">Meetings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
            <span className="text-muted-foreground font-medium">Tasks</span>
          </div>
        </div>
      </div>
    </section>
  );
};
