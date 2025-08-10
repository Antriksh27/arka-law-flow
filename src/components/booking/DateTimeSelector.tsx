
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { addDays, format, isWeekend, isBefore, startOfToday } from 'date-fns';

interface DateTimeSelectorProps {
  selectedDate: Date | null;
  selectedTime: string;
  onDateTimeSelect: (date: Date | null, time: string) => void;
}

export const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  selectedDate,
  selectedTime,
  onDateTimeSelect,
}) => {
  // Available time slots (business hours)
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  const isDateDisabled = (date: Date) => {
    const today = startOfToday();
    return isBefore(date, today) || isWeekend(date);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateTimeSelect(date, selectedTime);
    }
  };

  const handleTimeSelect = (time: string) => {
    onDateTimeSelect(selectedDate, time);
  };

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Select Date</h3>
        <div className="border rounded-lg p-4">
          <Calendar
            mode="single"
            selected={selectedDate || undefined}
            onSelect={handleDateSelect}
            disabled={isDateDisabled}
            className="w-full"
            fromDate={startOfToday()}
            toDate={addDays(startOfToday(), 60)}
          />
        </div>
      </div>

      {/* Time Selection */}
      {selectedDate && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Available Times for {format(selectedDate, 'EEEE, MMMM d')}
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {timeSlots.map((time) => (
              <Button
                key={time}
                type="button"
                variant={selectedTime === time ? "default" : "outline"}
                size="sm"
                onClick={() => handleTimeSelect(time)}
                className="text-sm"
              >
                {time}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
