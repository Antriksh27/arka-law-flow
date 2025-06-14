"use client";

import * as React from "react";
import { add, eachDayOfInterval, endOfMonth, endOfWeek, format, getDay, isEqual, isSameDay, isSameMonth, isToday, parse, startOfToday, startOfWeek } from "date-fns";
import { ChevronLeft,
// Changed from ChevronLeftIcon to match common lucide import
ChevronRight,
// Changed from ChevronRightIcon
PlusCircle,
// Changed from PlusCircleIcon
Search // Changed from SearchIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMediaQuery } from "@/hooks/use-media-query";
interface Event {
  id: string | number; // Changed to allow string IDs (UUIDs)
  name: string;
  time: string;
  datetime: string;
}
interface CalendarData {
  day: Date;
  events: Event[];
}
interface FullScreenCalendarProps {
  data: CalendarData[];
  initialMonth?: string; // Format "MMM-yyyy", e.g., "Jan-2024"
  onMonthChange?: (newMonthFirstDay: Date) => void;
  onDateSelect?: (date: Date) => void;
  onNewEventClick?: () => void;
}
const colStartClasses = ["", "col-start-2", "col-start-3", "col-start-4", "col-start-5", "col-start-6", "col-start-7"];
export function FullScreenCalendar({
  data,
  initialMonth,
  onMonthChange,
  onDateSelect,
  onNewEventClick
}: FullScreenCalendarProps) {
  const today = startOfToday();
  const [selectedDay, setSelectedDay] = React.useState(today);
  const [currentMonthString, setCurrentMonthString] = React.useState(initialMonth || format(today, "MMM-yyyy"));
  const firstDayCurrentMonth = parse(currentMonthString, "MMM-yyyy", new Date());
  const isDesktop = useMediaQuery("(min-width: 768px)");
  React.useEffect(() => {
    if (initialMonth) {
      setCurrentMonthString(initialMonth);
    }
  }, [initialMonth]);
  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth))
  });
  function handlePreviousMonth() {
    const firstDayPrevMonth = add(firstDayCurrentMonth, {
      months: -1
    });
    setCurrentMonthString(format(firstDayPrevMonth, "MMM-yyyy"));
    if (onMonthChange) {
      onMonthChange(firstDayPrevMonth);
    }
  }
  function handleNextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, {
      months: 1
    });
    setCurrentMonthString(format(firstDayNextMonth, "MMM-yyyy"));
    if (onMonthChange) {
      onMonthChange(firstDayNextMonth);
    }
  }
  function handleGoToToday() {
    setCurrentMonthString(format(today, "MMM-yyyy"));
    setSelectedDay(today);
    if (onMonthChange) {
      onMonthChange(today);
    }
    if (onDateSelect) {
      onDateSelect(today);
    }
  }
  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    if (onDateSelect) {
      onDateSelect(day);
    }
  };
  return <div className="flex flex-1 flex-col bg-white border border-borderGray rounded-2xl shadow-sm">
      {/* Calendar Header */}
      <div className="flex flex-col space-y-4 p-4 md:flex-row md:items-center md:justify-between md:space-y-0 lg:flex-none">
        <div className="flex flex-auto">
          <div className="flex items-center gap-4">
            <div className="hidden w-20 flex-col items-center justify-center rounded-lg border bg-muted p-0.5 md:flex">
              <h1 className="p-1 text-xs uppercase text-muted-foreground">
                {format(today, "MMM")}
              </h1>
              <div className="flex w-full items-center justify-center rounded-lg border bg-background p-0.5 text-lg font-bold">
                <span>{format(today, "d")}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-foreground">
                {format(firstDayCurrentMonth, "MMMM, yyyy")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {format(firstDayCurrentMonth, "MMM d, yyyy")} -{" "}
                {format(endOfMonth(firstDayCurrentMonth), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
          <Button variant="outline" size="icon" className="hidden lg:flex">
            <Search size={16} strokeWidth={2} aria-hidden="true" />
          </Button>

          <Separator orientation="vertical" className="hidden h-6 lg:block" />

          <div className="inline-flex w-full -space-x-px rounded-lg shadow-sm shadow-black/5 md:w-auto rtl:space-x-reverse">
            <Button onClick={handlePreviousMonth} variant="outline" size="icon" aria-label="Navigate to previous month" className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 text-slate-50 bg-slate-900 hover:bg-slate-800">
              <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
            <Button onClick={handleGoToToday} variant="outline" className="w-full rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 md:w-auto text-slate-50 bg-slate-900 hover:bg-slate-800">
              Today
            </Button>
            <Button onClick={handleNextMonth} variant="outline" size="icon" aria-label="Navigate to next month" className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 text-slate-50 bg-slate-900 hover:bg-slate-800">
              <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>

          <Separator orientation="vertical" className="hidden h-6 md:block" />
          <Separator orientation="horizontal" className="block w-full md:hidden" />

          <Button onClick={onNewEventClick} className="w-full gap-2 md:w-auto text-slate-50 bg-slate-900 hover:bg-slate-800">
            <PlusCircle size={16} strokeWidth={2} aria-hidden="true" />
            <span className="text-slate-50">New Event</span>
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="lg:flex lg:flex-auto lg:flex-col">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 border text-center text-xs font-semibold leading-6 text-textBase lg:flex-none">
          {/* Adjusted for Mon-Sun week start to match date-fns default if locale not set, or Sun-Sat if default. For consistency, let's use Sun-Sat */}
          <div className="border-r py-2.5">Sun</div>
          <div className="border-r py-2.5">Mon</div>
          <div className="border-r py-2.5">Tue</div>
          <div className="border-r py-2.5">Wed</div>
          <div className="border-r py-2.5">Thu</div>
          <div className="border-r py-2.5">Fri</div>
          <div className="py-2.5">Sat</div>
        </div>

        {/* Calendar Days */}
        <div className="flex text-xs leading-6 lg:flex-auto">
          <div className="hidden w-full border-x lg:grid lg:grid-cols-7 lg:grid-rows-6"> {/* Adjusted grid-rows for up to 6 weeks */}
            {days.map((day, dayIdx) => !isDesktop ? <button onClick={() => handleDayClick(day)} key={day.toISOString()} type="button" className={cn("flex h-14 flex-col border-b border-r px-3 py-2 hover:bg-muted focus:z-10", isEqual(day, selectedDay) && "bg-primary/10",
          // Adjusted selected style
          !isSameMonth(day, firstDayCurrentMonth) && "bg-accent/30 text-muted-foreground", isToday(day) && "font-semibold text-primary")}>
                  <time dateTime={format(day, "yyyy-MM-dd")} className={cn("ml-auto flex size-6 items-center justify-center rounded-full", isEqual(day, selectedDay) && "bg-primary text-primary-foreground", isToday(day) && !isEqual(day, selectedDay) && "border border-primary")}>
                    {format(day, "d")}
                  </time>
                  {data.filter(date => isSameDay(date.day, day)).length > 0 && <div className="mt-auto flex flex-wrap-reverse -mx-0.5">
                      {data.filter(date => isSameDay(date.day, day))[0].events.slice(0, 3) // Show max 3 dots
              .map(event => <span key={event.id} className="mx-0.5 mt-1 h-1.5 w-1.5 rounded-full bg-primary" // Changed from bg-sky-500 to bg-primary
              />)}
                    </div>}
                </button> :
          // Desktop view
          <div key={day.toISOString()} onClick={() => handleDayClick(day)} className={cn("relative flex flex-col border-b border-r p-1 pt-0 hover:bg-muted focus:z-10 cursor-pointer min-h-[100px]",
          // Ensure min height
          dayIdx === 0 && colStartClasses[getDay(day)], !isSameMonth(day, firstDayCurrentMonth) && "bg-accent/30 text-muted-foreground", isEqual(day, selectedDay) && "bg-primary/10")}>
                  <header className="flex items-center justify-end p-1.5">
                    <button type="button" className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs", isEqual(day, selectedDay) && "bg-primary text-primary-foreground", isToday(day) && !isEqual(day, selectedDay) && "font-semibold border border-primary text-primary", !isToday(day) && !isEqual(day, selectedDay) && isSameMonth(day, firstDayCurrentMonth) && "text-foreground", !isSameMonth(day, firstDayCurrentMonth) && "text-muted-foreground")}>
                      <time dateTime={format(day, "yyyy-MM-dd")}>
                        {format(day, "d")}
                      </time>
                    </button>
                  </header>
                  <div className="flex-1 px-1.5 pb-1.5 space-y-0.5 overflow-y-auto">
                    {data.filter(eventData => isSameDay(eventData.day, day)).flatMap(d => d.events) // Get all events for the day
              .slice(0, 2) // Show max 2 events detailed
              .map(event => <div key={event.id} className="flex flex-col items-start gap-0.5 rounded-md border bg-blue-50 p-1.5 text-xs leading-tight text-blue-700" // Changed from sky colors to blue
              >
                          <p className="font-medium leading-none truncate w-full">{event.name}</p>
                          <p className="leading-none text-blue-600">{event.time}</p> {/* Changed from sky-600 to blue-600 */}
                        </div>)}
                      {data.filter(eventData => isSameDay(eventData.day, day)).reduce((sum, d) => sum + d.events.length, 0) > 2 && <div className="text-xs text-muted-foreground pt-0.5">
                          + {data.filter(eventData => isSameDay(eventData.day, day)).reduce((sum, d) => sum + d.events.length, 0) - 2} more
                        </div>}
                  </div>
                </div>)}
          </div>

          {/* Mobile Calendar Days (Simplified) */}
          <div className="isolate grid w-full grid-cols-7 grid-rows-6 border-x lg:hidden"> {/* Adjusted grid-rows */}
            {days.map(day => <button onClick={() => handleDayClick(day)} key={`mobile-${day.toISOString()}`} type="button" className={cn("flex h-14 flex-col border-b border-r px-3 py-2 hover:bg-muted focus:z-10", isEqual(day, selectedDay) && "bg-primary/10", !isSameMonth(day, firstDayCurrentMonth) && "bg-accent/30 text-muted-foreground", isToday(day) && "font-semibold text-primary")}>
                <time dateTime={format(day, "yyyy-MM-dd")} className={cn("ml-auto flex size-6 items-center justify-center rounded-full", isEqual(day, selectedDay) && "bg-primary text-primary-foreground", isToday(day) && !isEqual(day, selectedDay) && "border border-primary")}>
                  {format(day, "d")}
                </time>
                {data.filter(date => isSameDay(date.day, day)).length > 0 && <div className="mt-auto flex flex-wrap-reverse -mx-0.5">
                    {data.filter(date => isSameDay(date.day, day))[0].events.slice(0, 3) // Show max 3 dots
              .map(event => <span key={event.id} className="mx-0.5 mt-1 h-1.5 w-1.5 rounded-full bg-primary" // Changed from bg-sky-500 to bg-primary
              />)}
                  </div>}
              </button>)}
          </div>
        </div>
      </div>
    </div>;
}