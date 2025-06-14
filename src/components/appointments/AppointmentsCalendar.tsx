
import React from 'react';
import { FilterState } from '../../pages/Appointments';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
  Check,
  MapPin,
} from 'lucide-react';

interface AppointmentsCalendarProps {
  filters: FilterState; // Kept for future use, not used in this static version
}

const days = ['Mon, 22', 'Tue, 23', 'Wed, 24', 'Thu, 25', 'Fri, 26'];
const timeSlots = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  // Add more time slots if needed, each representing an hour.
  // The div height for each slot (h-24) implies 1 hour per slot.
  // The last slot should also have a border-b if more content follows, or the container handles it.
];

// Placeholder for actual appointment data
// In a real app, this would come from props or a hook
const appointmentsData = [
  {
    id: '1',
    dayIndex: 0, // Monday
    timeIndex: 0, // 9:00 AM
    title: 'Rajesh Singh - Property Dispute #234',
    status: 'Upcoming',
    statusType: 'accent', // Maps to accent blue
    assignee: 'RS',
    type: 'Video Call',
    typeIcon: Video,
  },
  {
    id: '2',
    dayIndex: 1, // Tuesday
    timeIndex: 1, // 10:00 AM
    title: 'Mehta Corp - Contract Review',
    status: 'Completed',
    statusType: 'success', // Maps to green
    assignee: 'MC',
    type: 'Office',
    typeIcon: MapPin,
  },
];

export const AppointmentsCalendar: React.FC<AppointmentsCalendarProps> = ({ filters }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm w-full p-6 flex flex-col gap-4">
      {/* Calendar Controls */}
      <div className="flex w-full items-center gap-2 sm:gap-4 flex-wrap">
        <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
          Today
        </Button>
        <div className="flex items-center">
          <Button variant="outline" size="icon" className="h-9 w-9 border-gray-300 text-gray-700 hover:bg-gray-50">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9 border-gray-300 text-gray-700 hover:bg-gray-50 ml-1">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-lg font-medium text-gray-900">
          April 22 - 28, 2024 {/* This should be dynamic */}
        </span>
      </div>

      {/* Calendar Grid */}
      <div className="flex flex-col w-full overflow-x-auto">
        <div className="flex w-full min-w-[800px]"> {/* min-width for horizontal scroll */}
          {/* Time Gutter */}
          <div className="w-24 md:w-28 flex-none py-2 pr-2 text-sm text-gray-500">
            {/* Empty cell for alignment with day headers */}
          </div>
          {/* Day Headers */}
          {days.map((day) => (
            <div key={day} className="flex-1 min-w-[150px] text-center font-medium text-gray-700 p-2 border-b border-gray-200">
              {day}
            </div>
          ))}
        </div>

        <div className="flex w-full min-w-[800px] flex-1"> {/* min-width for horizontal scroll */}
          {/* Time Slots Column */}
          <div className="w-24 md:w-28 flex-none">
            {timeSlots.map((time) => (
              <div key={time} className="h-24 flex items-start justify-end pr-2 pt-1 border-r border-gray-200">
                <span className="text-xs text-gray-500">{time}</span>
              </div>
            ))}
          </div>

          {/* Appointment Slots Grid */}
          {days.map((day, dayIndex) => (
            <div key={day} className="flex-1 flex flex-col border-l border-gray-200">
              {timeSlots.map((time, timeIndex) => (
                <div
                  key={`${day}-${time}`}
                  className="h-24 border-b border-gray-200 relative p-1"
                >
                  {/* Render appointments here */}
                  {appointmentsData
                    .filter(app => app.dayIndex === dayIndex && app.timeIndex === timeIndex)
                    .map(app => {
                      const TypeIcon = app.typeIcon;
                      return (
                        <div 
                          key={app.id} 
                          className={`rounded-lg p-2 text-xs shadow-sm ${
                            app.statusType === 'accent' ? 'bg-accent text-accent-foreground' : 
                            app.statusType === 'success' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <Badge 
                              variant={
                                app.statusType === 'accent' ? 'default' : // 'default' for accent uses primary bg
                                app.statusType === 'success' ? 'secondary' : // using secondary for a different look
                                'outline'
                              }
                              className={
                                app.statusType === 'accent' ? 'bg-blue-100 text-primary border-blue-200' : // Customizing for accent
                                app.statusType === 'success' ? 'bg-green-100 text-green-700 border-green-200' :
                                'border-gray-300'
                              }
                            >
                              {app.status === 'Upcoming' && <Clock className="mr-1 h-3 w-3" />}
                              {app.status === 'Completed' && <Check className="mr-1 h-3 w-3" />}
                              {app.status}
                            </Badge>
                            <Avatar className="h-6 w-6 text-xs">
                              <AvatarFallback 
                                className={
                                  app.statusType === 'accent' ? 'bg-blue-200 text-primary' : 
                                  app.statusType === 'success' ? 'bg-green-200 text-green-800' : 'bg-gray-200'
                                }
                              >
                                {app.assignee}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <p className="font-semibold mb-0.5 truncate">{app.title}</p>
                          <div className="flex items-center">
                            <TypeIcon className="mr-1 h-3 w-3" />
                            <span>{app.type}</span>
                          </div>
                        </div>
                      );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
