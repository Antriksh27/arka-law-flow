import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Clock, User, Plus, Edit, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format, addDays, isSameDay } from "date-fns";
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

interface Lawyer {
  id: string;
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
  onAppointmentCreate?: (appointment: Omit<Appointment, 'id'>) => void;
  onAppointmentEdit?: (appointment: Appointment) => void;
  onAppointmentDelete?: (appointmentId: string) => void;
}

function MultiUserCalendar({
  lawyers = [],
  appointments = [
    {
      id: '1',
      lawyerId: '1',
      clientName: 'John Smith',
      time: '09:00',
      duration: 60,
      type: 'Consultation',
      date: new Date()
    },
    {
      id: '2',
      lawyerId: '2',
      clientName: 'Jane Doe',
      time: '10:30',
      duration: 90,
      type: 'Contract Review',
      date: new Date()
    },
    {
      id: '3',
      lawyerId: '1',
      clientName: 'Bob Johnson',
      time: '14:00',
      duration: 45,
      type: 'Legal Advice',
      date: addDays(new Date(), 1)
    },
  ],
  onAppointmentCreate,
  onAppointmentEdit,
  onAppointmentDelete
}: MultiUserCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedLawyer, setSelectedLawyer] = useState<string | null>(null);

  const timeSlots = Array.from({ length: 18 }, (_, i) => {
    const hour = Math.floor(9 + i * 0.5);
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

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
                      setSelectedDate(date);
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
                        <Badge variant={selectedLawyer === lawyer.id ? "default" : "outline"} className="text-xs">
                          {dayAppointments.filter(apt => apt.lawyerId === lawyer.id).length}
                        </Badge>
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
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Schedule for {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  <Badge variant="outline" className="ml-auto">
                    {dayAppointments.length} appointments
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
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
                        <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: `120px repeat(${lawyers.length}, 1fr)` }}>
                          <div className="font-semibold text-muted-foreground text-center py-3">Time</div>
                          {lawyers.map((lawyer) => (
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
                              style={{ gridTemplateColumns: `120px repeat(${lawyers.length}, 1fr)` }}
                            >
                              <div className="text-center py-3 text-sm font-medium text-muted-foreground bg-white/60 rounded-lg border">
                                {time}
                              </div>
                              {lawyers.map((lawyer) => {
                                const appointment = getAppointmentForSlot(lawyer.id, time, selectedDate);
                                
                                return (
                                  <div key={`${lawyer.id}-${time}`} className="h-14">
                                    {appointment ? (
                                      <div className={cn(
                                        "h-full rounded-xl p-3 text-white text-xs relative group shadow-lg border-2 border-white/20 hover:scale-105 transition-transform",
                                        lawyer.color
                                      )}>
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
                                    ) : (
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

  // Get lawyers with colors
  const { data: lawyers = [] } = useQuery({
    queryKey: ['reception-lawyers', firmId],
    queryFn: async () => {
      const { data } = await supabase
        .from('team_members')
        .select('id, user_id, full_name, role')
        .eq('firm_id', firmId)
        .in('role', ['lawyer', 'admin', 'junior']);
      
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
      
      return (data || []).map((lawyer, index) => ({
        id: lawyer.id,
        name: lawyer.full_name || 'Unnamed Lawyer',
        initials: lawyer.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'UL',
        color: colors[index % colors.length]
      }));
    },
    enabled: !!firmId
  });

  const handleAppointmentCreate = (appointment: Omit<Appointment, 'id'>) => {
    console.log('Creating appointment:', appointment);
  };

  const handleAppointmentEdit = (appointment: Appointment) => {
    console.log('Editing appointment:', appointment);
  };

  const handleAppointmentDelete = (appointmentId: string) => {
    console.log('Deleting appointment:', appointmentId);
  };

  return (
    <MultiUserCalendar
      lawyers={lawyers}
      onAppointmentCreate={handleAppointmentCreate}
      onAppointmentEdit={handleAppointmentEdit}
      onAppointmentDelete={handleAppointmentDelete}
    />
  );
};

export default ReceptionCalendar;