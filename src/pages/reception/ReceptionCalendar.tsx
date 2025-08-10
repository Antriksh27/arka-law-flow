import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Clock, User, Plus, Edit, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format, addDays, isSameDay, getDay } from "date-fns";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
const BookAppointmentDialog = React.lazy(() => import('@/components/reception/BookAppointmentDialog'));
import EditAppointmentDialog from '@/components/reception/EditAppointmentDialog';
import { toast } from '@/hooks/use-toast';

interface Lawyer {
  id: string; // team_members.id
  userId: string; // auth user id
  name: string;
  initials: string;
  color: string;
}

interface Appointment {
  id: string;
  lawyerId: string;
  clientName: string;
  time: string;
  duration: number;
  type: string;
  date: Date;
}

interface MultiUserCalendarProps {
  lawyers?: Lawyer[];
  appointments?: Appointment[];
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
  onAppointmentCreate?: (appointment: Omit<Appointment, 'id'>) => void;
  onAppointmentEdit?: (appointment: Appointment) => void;
  onAppointmentDelete?: (appointmentId: string) => void;
  isSlotBookable?: (lawyer: Lawyer, date: Date, time: string) => boolean;
  onAppointmentMove?: (appointmentId: string, targetLawyerId: string, date: Date, time: string) => void;
}

function MultiUserCalendar({
  lawyers = [],
  appointments = [],
  selectedDate,
  onSelectedDateChange,
  onAppointmentCreate,
  onAppointmentEdit,
  onAppointmentDelete,
  isSlotBookable,
  onAppointmentMove,
}: MultiUserCalendarProps) {
  const [selectedLawyer, setSelectedLawyer] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedLawyerIds, setSelectedLawyerIds] = useState<string[]>([]);

  const displayedLawyers = useMemo(() => {
    if (!lawyers?.length) return [] as Lawyer[];
    if (!selectedLawyerIds.length) return lawyers; // default: show all
    return lawyers.filter((l) => selectedLawyerIds.includes(l.id));
  }, [lawyers, selectedLawyerIds]);

  // Availability & exceptions for displayed lawyers
  type AvailabilityRule = {
    id: string;
    user_id: string;
    day_of_week: number;
    start_time: string; // HH:mm or ISO partial
    end_time: string;
    appointment_duration: number;
    buffer_time: number;
    max_appointments_per_day: number | null;
    is_active: boolean;
  };
  type AvailabilityException = { id: string; user_id: string; date: string; is_blocked: boolean };

  const userIds = useMemo(() => displayedLawyers.map(l => l.userId).filter(Boolean), [displayedLawyers]);
  const selectedDateStr = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);
  const dayOfWeek = selectedDate.getDay();

  const { data: availRules = [] } = useQuery({
    queryKey: ['multi-avail-rules', userIds],
    queryFn: async () => {
      if (!userIds.length) return [] as AvailabilityRule[];
      const { data, error } = await supabase
        .from('availability_rules')
        .select('*')
        .in('user_id', userIds)
        .eq('is_active', true);
      if (error) throw error;
      return (data || []) as AvailabilityRule[];
    },
    enabled: userIds.length > 0,
  });

  const { data: exceptions = [] } = useQuery({
    queryKey: ['multi-avail-exc', userIds, selectedDateStr],
    queryFn: async () => {
      if (!userIds.length) return [] as AvailabilityException[];
      const { data, error } = await supabase
        .from('availability_exceptions')
        .select('id, user_id, date, is_blocked')
        .eq('date', selectedDateStr)
        .in('user_id', userIds);
      if (error) throw error;
      return (data || []) as AvailabilityException[];
    },
    enabled: userIds.length > 0,
  });

  const rulesByUser = useMemo(() => {
    const map = new Map<string, AvailabilityRule[]>();
    for (const r of availRules) {
      if (!map.has(r.user_id)) map.set(r.user_id, []);
      map.get(r.user_id)!.push(r);
    }
    return map;
  }, [availRules]);

  const blockedByUser = useMemo(() => new Set(exceptions.filter(e => e.is_blocked).map(e => e.user_id)), [exceptions]);

  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const normalizeTime = (t?: string | null) => (t ? String(t).slice(0, 5) : '');

  const getRuleForTime = (userId: string, time: string): AvailabilityRule | undefined => {
    const rules = rulesByUser.get(userId) || [];
    return rules.find(r => r.day_of_week === dayOfWeek && normalizeTime(r.start_time) <= time && normalizeTime(r.end_time) > time);
  };

  const slotHasConflict = (lawyerTeamId: string, time: string, durationMin: number) => {
    const start = timeToMinutes(time);
    const end = start + durationMin;
    return appointments.some(a => a.lawyerId === lawyerTeamId && isSameDay(a.date, selectedDate) && (() => {
      const aStart = timeToMinutes(a.time);
      const aEnd = aStart + (a.duration || 60);
      return start < aEnd && end > aStart;
    })());
  };

  const isBookableSlot = (lawyer: Lawyer, time: string): boolean => {
    // Blocked day
    if (blockedByUser.has(lawyer.userId)) return false;
    // Must have a rule covering this time
    const rule = getRuleForTime(lawyer.userId, time);
    if (!rule) return false;
    // Check conflicts using rule duration
    return !slotHasConflict(lawyer.id, time, rule.appointment_duration || 30);
  };

  const timeSlots = useMemo(() => {
    const startMinutes = 9 * 60;
    const endMinutes = 21 * 60; // exclusive - last slot starts at 20:30
    const slots: string[] = [];
    for (let m = startMinutes; m < endMinutes; m += 30) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
    }
    return slots;
  }, []);

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => isSameDay(apt.date, date));
  };

  const getAppointmentForSlot = (lawyerId: string, time: string, date: Date) => {
    return appointments.find(apt => 
      apt.lawyerId === lawyerId && 
      apt.time === time && 
      isSameDay(apt.date, date)
    );
  };

  const dayAppointments = getAppointmentsForDate(selectedDate);

  const coveredSlots = useMemo(() => {
    const set = new Set<string>();
    for (const apt of dayAppointments) {
      const startIdx = timeSlots.indexOf(apt.time);
      if (startIdx === -1) continue;
      const span = Math.max(1, Math.ceil((apt.duration || 60) / 30));
      for (let k = 1; k < span; k++) {
        const t = timeSlots[startIdx + k];
        if (t) set.add(`${apt.lawyerId}-${t}`);
      }
    }
    return set;
  }, [dayAppointments, timeSlots]);

  return (
    <div className="h-full w-full bg-background overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Schedule Management
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Manage daily appointments for all lawyers in one view
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Calendar Section */}
          <div className="xl:col-span-1">
            <Card className="shadow-lg border-0 bg-white/50 backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      onSelectedDateChange(date);
                      setSelectedLawyer(null);
                    }
                  }}
                  className="w-full"
                  disabled={[{ before: new Date() }]}
                />
              </CardContent>
            </Card>

            {/* Lawyers List */}
            <Card className="mt-6 shadow-lg border-0 bg-white/50 backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Lawyers
                  <Badge variant="outline" className="ml-auto">
                    {lawyers.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {lawyers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No lawyers found</p>
                    </div>
                  ) : (
                    lawyers.map((lawyer) => (
                      <div
                        key={lawyer.id}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02]",
                          selectedLawyer === lawyer.id 
                            ? "bg-primary/10 border-primary shadow-md" 
                            : "bg-white/80 border-border hover:bg-accent hover:border-accent-foreground/20"
                        )}
                        onClick={() => setSelectedLawyer(
                          selectedLawyer === lawyer.id ? null : lawyer.id
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg",
                          lawyer.color
                        )}>
                          {lawyer.initials}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-foreground">{lawyer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {dayAppointments.filter(apt => apt.lawyerId === lawyer.id).length} appointments today
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={!selectedLawyerIds.length || selectedLawyerIds.includes(lawyer.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedLawyerIds((prev) => {
                              if (!prev.length) {
                                // default all selected -> start from all minus unchecked
                                return e.target.checked ? lawyers.map(l => l.id) : lawyers.filter(l => l.id !== lawyer.id).map(l => l.id);
                              }
                              if (e.target.checked) return Array.from(new Set([...prev, lawyer.id]));
                              return prev.filter(id => id !== lawyer.id);
                            });
                          }}
                          aria-label={`Toggle ${lawyer.name}`}
                        />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Schedule Grid */}
          <div className="xl:col-span-4">
            <Card className="shadow-lg border-0 bg-white/50 backdrop-blur">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Schedule for {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </CardTitle>
                  <div className="ml-auto flex items-center gap-2">
                    <div className="hidden sm:flex rounded-lg border bg-background p-1">
                      <Button variant={viewMode === 'day' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('day')}>Day</Button>
                      <Button variant={viewMode === 'week' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('week')}>Week</Button>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => onSelectedDateChange(addDays(selectedDate, viewMode === 'day' ? -1 : -7))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => onSelectedDateChange(addDays(selectedDate, viewMode === 'day' ? 1 : 7))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Badge variant="outline" className="ml-2">
                      {dayAppointments.length} appointments
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                  <div className="min-w-[900px]">
                    {lawyers.length === 0 ? (
                      <div className="text-center py-16 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No lawyers available</p>
                        <p className="text-sm">Please add lawyers to view the schedule</p>
                      </div>
                    ) : (
                      <>
                        {/* Header */}
                        <div className="grid gap-3 mb-6 sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75" style={{ gridTemplateColumns: `120px repeat(${displayedLawyers.length}, 1fr)` }}>
                          <div className="font-semibold text-muted-foreground text-center py-3 sticky left-0 z-20 bg-background/95 rounded-lg">Time</div>
                          {displayedLawyers.map((lawyer) => (
                            <div key={lawyer.id} className="text-center p-3 bg-white/80 rounded-xl border">
                              <div className={cn(
                                "w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold shadow-lg",
                                lawyer.color
                              )}>
                                {lawyer.initials}
                              </div>
                              <p className="text-sm font-semibold truncate text-foreground">{lawyer.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {dayAppointments.filter(apt => apt.lawyerId === lawyer.id).length} appointments
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Time Slots */}
                        <div className="space-y-2">
                          {timeSlots.map((time) => (
                            <div 
                              key={time} 
                              className="grid gap-3 items-center" 
                              style={{ gridTemplateColumns: `120px repeat(${displayedLawyers.length}, 1fr)` }}
                            >
                              <div className="text-center py-3 text-sm font-medium text-muted-foreground bg-white/60 rounded-lg border">
                                {time}
                              </div>
                              {displayedLawyers.map((lawyer) => {
                                const appointment = getAppointmentForSlot(lawyer.id, time, selectedDate);
                                const isCovered = coveredSlots.has(`${lawyer.id}-${time}`);
                                
                                return (
                                  <div key={`${lawyer.id}-${time}`} className="h-14">
                                    {appointment ? (
                                      (() => {
                                        const span = Math.max(1, Math.ceil((appointment.duration || 60) / 30));
                                        const heightPx = 56 * span + 8 * (span - 1); // h-14 (56px) + space-y-2 (8px) per extra slot
                                        return (
                                          <div
                                            className={cn(
                                              "rounded-xl p-3 text-white text-xs relative group shadow-lg border-2 border-white/20 hover:scale-105 transition-transform",
                                              lawyer.color
                                            )}
                                            style={{ height: `${heightPx}px` }}
                                          >
                                            <div className="font-semibold truncate mb-1">
                                              {appointment.clientName}
                                            </div>
                                            <div className="text-xs opacity-90 truncate">
                                              {appointment.type}
                                            </div>
                                            
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white/20 rounded-md"
                                                >
                                                  <Edit className="h-3 w-3" />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                  onClick={() => onAppointmentEdit?.(appointment)}
                                                >
                                                  <Edit className="h-4 w-4 mr-2" />
                                                  Edit Appointment
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                  onClick={() => onAppointmentDelete?.(appointment.id)}
                                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                >
                                                  <Trash2 className="h-4 w-4 mr-2" />
                                                  Delete Appointment
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>
                                        );
                                      })()
                                    ) : isCovered ? (
                                      <div className="h-full w-full" />
                                    ) : (
                                      isBookableSlot(lawyer, time) ? (
                                        <Button
                                          variant="ghost"
                                          className="h-full w-full border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 rounded-xl transition-all duration-200 hover:scale-105"
                                          onClick={() => {
                                            onAppointmentCreate?.({
                                              lawyerId: lawyer.id,
                                              clientName: 'New Client',
                                              time,
                                              duration: 60,
                                              type: 'Consultation',
                                              date: selectedDate
                                            });
                                          }}
                                        >
                                          <Plus className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                      ) : (
                                        <div className="h-full w-full rounded-xl border bg-muted/20 text-muted-foreground text-[11px] flex items-center justify-center">
                                          Not Available
                                        </div>
                                      )
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Today's Summary */}
        <Card className="mt-8 shadow-lg border-0 bg-white/50 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Today's Appointments Summary
              <Badge variant="outline" className="ml-auto">
                {dayAppointments.length} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {lawyers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No lawyers to display summary for</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {lawyers.map((lawyer) => {
                  const lawyerAppointments = dayAppointments.filter(apt => apt.lawyerId === lawyer.id);
                  return (
                    <div key={lawyer.id} className="border-2 border-border rounded-xl p-4 bg-white/80 hover:bg-white hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg",
                          lawyer.color
                        )}>
                          {lawyer.initials}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{lawyer.name}</p>
                          <Badge variant={lawyerAppointments.length > 0 ? "default" : "outline"} className="text-xs">
                            {lawyerAppointments.length} appointments
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {lawyerAppointments.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No appointments today</p>
                        ) : (
                          lawyerAppointments.map((apt) => (
                            <div key={apt.id} className="text-xs bg-accent/50 rounded-lg p-2">
                              <div className="font-semibold text-foreground">{apt.time} - {apt.clientName}</div>
                              <div className="text-muted-foreground">{apt.type}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const ReceptionCalendar = () => {
  const { firmId } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookOpen, setBookOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [initialBooking, setInitialBooking] = useState<{ lawyerUserId?: string; date?: string; time?: string }>({});

  // Get lawyers with colors
  const { data: lawyers = [] } = useQuery({
    queryKey: ['reception-lawyers', firmId],
    queryFn: async () => {
      const { data } = await supabase
        .from('team_members')
        .select('id, user_id, full_name, role')
        .eq('firm_id', firmId)
        .in('role', ['lawyer', 'admin', 'junior']);
      
      const sortedData = data?.sort((a, b) => {
        const nameA = a.full_name?.toLowerCase() || '';
        const nameB = b.full_name?.toLowerCase() || '';
        if (nameA.includes('chitrajeet upadhyaya')) return -1;
        if (nameB.includes('chitrajeet upadhyaya')) return 1;
        return nameA.localeCompare(nameB);
      }) || [];
      
      const colors = [
        'bg-blue-500',
        'bg-green-500', 
        'bg-purple-500',
        'bg-orange-500',
        'bg-red-500',
        'bg-indigo-500',
        'bg-pink-500',
        'bg-teal-500'
      ];
      
      return sortedData.map((lawyer, index) => ({
        id: lawyer.id,
        userId: lawyer.user_id,
        name: lawyer.full_name || 'Unnamed Lawyer',
        initials: lawyer.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'UL',
        color: colors[index % colors.length]
      }));
    },
    enabled: !!firmId
  });

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  // Fetch appointments for selected date
  const { data: rawAppointments = [] } = useQuery({
    queryKey: ['reception-appointments', firmId, selectedDateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('firm_id', firmId)
        .eq('appointment_date', selectedDateStr)
        .order('appointment_time', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!firmId && !!selectedDate
  });

  const lawyerIdByUserId = new Map(lawyers.map(l => [l.userId, l.id]));
  const calendarAppointments: Appointment[] = rawAppointments
    .map((apt: any) => ({
      id: apt.id,
      lawyerId: lawyerIdByUserId.get(apt.lawyer_id) || '',
      clientName: apt.title || 'Appointment',
      time: apt.appointment_time ? String(apt.appointment_time).slice(0, 5) : '',
      duration: apt.duration_minutes ?? 60,
      type: apt.type || 'Consultation',
      date: new Date(apt.appointment_date)
    }))
    .filter(a => a.lawyerId && a.time);

  const handleAppointmentCreate = (appointment: Omit<Appointment, 'id'>) => {
    const lawyerUserId = lawyers.find(l => l.id === appointment.lawyerId)?.userId;
    setInitialBooking({
      lawyerUserId,
      date: format(appointment.date, 'yyyy-MM-dd'),
      time: appointment.time
    });
    setBookOpen(true);
  };

  const handleAppointmentEdit = (appointment: Appointment) => {
    const found = (rawAppointments as any[]).find(a => a.id === appointment.id) || null;
    setSelectedAppointment(found);
    setEditOpen(true);
  };

  const handleAppointmentDelete = async (appointmentId: string) => {
    // Soft-delete by marking as cancelled to respect RLS
    await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId);
    queryClient.invalidateQueries({ queryKey: ['reception-appointments'] });
  };

  return (
    <>
      <MultiUserCalendar
        lawyers={lawyers}
        appointments={calendarAppointments}
        selectedDate={selectedDate}
        onSelectedDateChange={setSelectedDate}
        onAppointmentCreate={handleAppointmentCreate}
        onAppointmentEdit={handleAppointmentEdit}
        onAppointmentDelete={handleAppointmentDelete}
      />

      {/* Dialogs */}
      <React.Suspense fallback={null}>
        <BookAppointmentDialog 
          open={bookOpen} 
          onOpenChange={(o) => {
            setBookOpen(o);
            if (!o) setInitialBooking({});
          }}
          // @ts-ignore - extra props handled in component
          initialLawyerId={initialBooking.lawyerUserId}
          initialDate={initialBooking.date}
          initialTime={initialBooking.time}
        />
      </React.Suspense>

      {selectedAppointment && (
        <EditAppointmentDialog 
          open={editOpen} 
          onOpenChange={(o) => {
            setEditOpen(o);
            if (!o) setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
        />
      )}
    </>
  );
};

export default ReceptionCalendar;