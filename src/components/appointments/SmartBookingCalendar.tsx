import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { format, addMinutes, isAfter, isBefore, startOfDay, endOfDay, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Clock, User } from 'lucide-react';

interface AvailabilityRule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  appointment_duration: number;
  buffer_time: number;
  max_appointments_per_day: number | null;
  is_active: boolean;
}

interface AvailabilityException {
  id: string;
  date: string;
  is_blocked: boolean;
}

interface ExistingAppointment {
  id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

interface SmartBookingCalendarProps {
  selectedLawyer: string | null;
  onTimeSlotSelect: (date: Date, time: string, duration: number) => void;
  selectedDate?: Date;
  selectedTime?: string;
  hideLawyerPicker?: boolean;
  onLawyerChange?: (lawyerId: string) => void;
}

export const SmartBookingCalendar: React.FC<SmartBookingCalendarProps> = ({
  selectedLawyer,
  onTimeSlotSelect,
  selectedDate,
  selectedTime,
  hideLawyerPicker,
  onLawyerChange
}) => {
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date | undefined>(selectedDate);

  // Fetch lawyers for selection
  const { data: lawyers } = useQuery({
    queryKey: ['team-lawyers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['lawyer', 'admin', 'partner', 'associate']);

      if (error) throw error;
      return data.map(profile => ({
        id: profile.id,
        name: profile.full_name,
        role: profile.role
      }));
    }
  });

  // Fetch availability rules for selected lawyer
  const { data: availabilityRules } = useQuery({
    queryKey: ['availability-rules', selectedLawyer],
    queryFn: async () => {
      if (!selectedLawyer) return [];
      
      const { data, error } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('user_id', selectedLawyer)
        .eq('is_active', true);

      if (error) throw error;
      return data as AvailabilityRule[];
    },
    enabled: !!selectedLawyer
  });

  // Fetch exceptions for selected lawyer
  const { data: exceptions } = useQuery({
    queryKey: ['availability-exceptions', selectedLawyer],
    queryFn: async () => {
      if (!selectedLawyer) return [];
      
      const { data, error } = await supabase
        .from('availability_exceptions')
        .select('*')
        .eq('user_id', selectedLawyer);

      if (error) throw error;
      return data as AvailabilityException[];
    },
    enabled: !!selectedLawyer
  });

  // Fetch existing appointments for selected date and lawyer
  const { data: existingAppointments } = useQuery({
    queryKey: ['existing-appointments', selectedLawyer, internalSelectedDate],
    queryFn: async () => {
      if (!selectedLawyer || !internalSelectedDate) return [];
      
      const dateStr = format(internalSelectedDate, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('appointments')
        .select('id, start_time, end_time, duration_minutes')
        .eq('lawyer_id', selectedLawyer)
        .eq('appointment_date', dateStr)
        .neq('status', 'cancelled');

      if (error) throw error;
      return data as ExistingAppointment[];
    },
    enabled: !!selectedLawyer && !!internalSelectedDate
  });

  const isDateAvailable = (date: Date): boolean => {
    if (!selectedLawyer || !availabilityRules) return false;
    
    const dayOfWeek = date.getDay();
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Check if there are availability rules for this day
    const hasRulesForDay = availabilityRules.some(rule => rule.day_of_week === dayOfWeek);
    if (!hasRulesForDay) return false;
    
    // Check if date is blocked
    const isBlocked = exceptions?.some(exc => exc.date === dateStr && exc.is_blocked);
    if (isBlocked) return false;
    
    return true;
  };

  // Safely parse a date/time that may be ISO or just a time string (HH:mm or HH:mm:ss)
  const parseDateTime = (dateStr: string, value?: string | null): Date | null => {
    if (!value || typeof value !== 'string') return null;
    const normalized = value.includes('T') ? value : `${dateStr}T${value}`;
    return parseISO(normalized);
  };

  const generateTimeSlots = (): TimeSlot[] => {
    if (!selectedLawyer || !internalSelectedDate || !availabilityRules) return [];
    
    const dayOfWeek = internalSelectedDate.getDay();
    const dateStr = format(internalSelectedDate, 'yyyy-MM-dd');
    
    // Get rules for this day
    const rulesForDay = availabilityRules.filter(rule => rule.day_of_week === dayOfWeek);
    if (rulesForDay.length === 0) return [];
    
    // Check if date is blocked
    const isBlocked = exceptions?.some(exc => exc.date === dateStr && exc.is_blocked);
    if (isBlocked) {
      return [{
        time: 'blocked',
        available: false,
        reason: 'Date is blocked'
      }];
    }
    
    const slots: TimeSlot[] = [];
    
    rulesForDay.forEach(rule => {
      if (!rule.start_time || !rule.end_time) return;
      const startTime = parseDateTime(dateStr, rule.start_time)!;
      const endTime = parseDateTime(dateStr, rule.end_time)!;
      const duration = rule.appointment_duration;
      const buffer = rule.buffer_time;

      if (!startTime || !endTime) return;

      let currentTime = startTime;

      while (isBefore(addMinutes(currentTime, duration), endTime) ||
             currentTime.getTime() === endTime.getTime() - duration * 60000) {
        const timeStr = format(currentTime, 'HH:mm');
        const slotEndTime = addMinutes(currentTime, duration);

        // Check if slot conflicts with existing appointments (safely)
        const hasConflict = existingAppointments?.some(apt => {
          const aptStart = parseDateTime(dateStr, apt.start_time);
          const aptEnd = parseDateTime(dateStr, apt.end_time);
          if (!aptStart || !aptEnd) return false;
          return (
            isBefore(currentTime, aptEnd) && isAfter(slotEndTime, aptStart)
          );
        }) ?? false;

        slots.push({
          time: timeStr,
          available: !hasConflict,
          reason: hasConflict ? 'Time slot is already booked' : undefined
        });

        currentTime = addMinutes(currentTime, duration + buffer);
      }
    });
    
    // Check daily limits
    if (rulesForDay.some(rule => rule.max_appointments_per_day !== null)) {
      const maxAppointments = Math.min(...rulesForDay
        .filter(rule => rule.max_appointments_per_day !== null)
        .map(rule => rule.max_appointments_per_day!)
      );
      
      const appointmentCount = existingAppointments?.length || 0;
      
      if (appointmentCount >= maxAppointments) {
        return slots.map(slot => ({
          ...slot,
          available: false,
          reason: 'Daily appointment limit reached'
        }));
      }
    }
    
    return slots.sort((a, b) => a.time.localeCompare(b.time));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setInternalSelectedDate(date);
  };

  const handleTimeSlotClick = (time: string) => {
    if (!internalSelectedDate || !selectedLawyer || !availabilityRules) return;
    
    const dayOfWeek = internalSelectedDate.getDay();
    const norm = (t?: string | null) => (t ? String(t).slice(0, 5) : '');
    const ruleForTime = availabilityRules.find(rule => 
      rule.day_of_week === dayOfWeek && 
      norm(rule.start_time) <= time && 
      norm(rule.end_time) > time
    );
    
    if (ruleForTime) {
      onTimeSlotSelect(internalSelectedDate, time, ruleForTime.appointment_duration);
    }
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="space-y-6">
      {/* Lawyer Selection */}
      {!hideLawyerPicker && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Lawyer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedLawyer || ''} onValueChange={(value) => {
              if (onLawyerChange) onLawyerChange(value);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a lawyer..." />
              </SelectTrigger>
              <SelectContent>
                {lawyers?.map(lawyer => (
                  <SelectItem key={lawyer.id} value={lawyer.id}>
                    {lawyer.name} ({lawyer.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {selectedLawyer && (
        <>
          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={internalSelectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today || !isDateAvailable(date);
                }}
                className="rounded-md border w-full"
              />
            </CardContent>
          </Card>

          {/* Time Slot Selection */}
          {internalSelectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Available Times
                  </div>
                  <Badge variant="outline">
                    {format(internalSelectedDate, 'EEEE, MMMM d')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {timeSlots.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No availability on this date</p>
                  </div>
                ) : timeSlots.every(slot => !slot.available) ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No available time slots</p>
                    {timeSlots[0]?.reason && (
                      <p className="text-sm mt-2">{timeSlots[0].reason}</p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {timeSlots.map(slot => (
                      <Button
                        key={slot.time}
                        type="button"
                        variant={selectedTime === slot.time ? "default" : "outline"}
                        size="sm"
                        disabled={!slot.available}
                        onClick={() => slot.available && handleTimeSlotClick(slot.time)}
                        className="text-sm"
                        title={slot.reason}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};