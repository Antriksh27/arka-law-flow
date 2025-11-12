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
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getEventDots = (date: Date) => {
    const dayEvents = events.find((e) => isSameDay(e.date, date));
    if (!dayEvents || dayEvents.count === 0) return null;

    const colors = {
      hearing: 'bg-red-500',
      appointment: 'bg-blue-500',
      task: 'bg-green-500',
    };

    return (
      <div className="flex gap-0.5 justify-center mt-1">
        {dayEvents.types.slice(0, 3).map((type, idx) => (
          <div key={idx} className={`w-1 h-1 rounded-full ${colors[type as keyof typeof colors] || 'bg-gray-400'}`} />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <section className="mb-6">
        <h2 className="text-base font-semibold text-foreground mb-3">This Week</h2>
        <div className="bg-card rounded-xl border border-border p-4 animate-pulse">
          <div className="flex justify-between mb-4">
            {weekDays.map((_, i) => (
              <div key={i} className="flex flex-col items-center w-10">
                <div className="h-3 bg-muted rounded w-6 mb-2" />
                <div className="h-8 bg-muted rounded-full w-8" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold text-foreground mb-3">This Week</h2>
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex justify-between mb-2">
          {weekDays.map((day, index) => {
            const isToday = isSameDay(day, today);
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <span className="text-xs text-muted-foreground mb-1">
                  {format(day, 'EEE').charAt(0)}
                </span>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    isToday
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {format(day, 'd')}
                </div>
                {getEventDots(day)}
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Hearings</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Appointments</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Tasks</span>
          </div>
        </div>
      </div>
    </section>
  );
};
