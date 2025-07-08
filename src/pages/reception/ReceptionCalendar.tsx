import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Plus, Edit, Trash2 } from "lucide-react";
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
import { cn } from '@/lib/utils';

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
  lawyers = [
    { id: '1', name: 'Sarah Johnson', initials: 'SJ', color: 'bg-blue-500' },
    { id: '2', name: 'Michael Chen', initials: 'MC', color: 'bg-green-500' },
    { id: '3', name: 'Emily Davis', initials: 'ED', color: 'bg-purple-500' },
    { id: '4', name: 'Robert Wilson', initials: 'RW', color: 'bg-orange-500' },
  ],
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
    <div className="w-full max-w-7xl mx-auto p-6 bg-[#F9FAFB]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827] mb-2">
          Law Firm Reception Calendar
        </h1>
        <p className="text-[#6B7280]">
          Manage daily appointments for all lawyers in one view
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Date</CardTitle>
            </CardHeader>
            <CardContent>
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
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Lawyers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lawyers.map((lawyer) => (
                  <div
                    key={lawyer.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedLawyer === lawyer.id 
                        ? "bg-[#E0E7FF] border-[#1E3A8A]" 
                        : "hover:bg-[#F3F4F6]"
                    )}
                    onClick={() => setSelectedLawyer(
                      selectedLawyer === lawyer.id ? null : lawyer.id
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
                      lawyer.color
                    )}>
                      {lawyer.initials}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{lawyer.name}</p>
                      <p className="text-xs text-[#6B7280]">
                        {dayAppointments.filter(apt => apt.lawyerId === lawyer.id).length} appointments
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Grid */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Schedule for {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Header */}
                  <div className="grid grid-cols-[100px_1fr] gap-2 mb-4">
                    <div className="font-medium text-sm text-[#6B7280]">Time</div>
                    <div className="grid grid-cols-4 gap-2">
                      {lawyers.map((lawyer) => (
                        <div key={lawyer.id} className="text-center">
                          <div className={cn(
                            "w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-white text-xs font-medium",
                            lawyer.color
                          )}>
                            {lawyer.initials}
                          </div>
                          <p className="text-xs font-medium truncate">{lawyer.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="space-y-1">
                    {timeSlots.map((time) => (
                      <div key={time} className="grid grid-cols-[100px_1fr] gap-2">
                        <div className="flex items-center text-sm text-[#6B7280] font-medium">
                          {time}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {lawyers.map((lawyer) => {
                            const appointment = getAppointmentForSlot(lawyer.id, time, selectedDate);
                            
                            return (
                              <div key={`${lawyer.id}-${time}`} className="h-12">
                                {appointment ? (
                                  <div className={cn(
                                    "h-full rounded-md p-2 text-white text-xs relative group",
                                    lawyer.color
                                  )}>
                                    <div className="font-medium truncate">
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
                                          className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white/20"
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
                                          className="text-red-600 hover:bg-red-50 hover:text-red-600 focus:bg-red-50 focus:text-red-600"
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
                                    className="h-full w-full border-2 border-dashed border-[#E5E7EB] hover:border-[#1E3A8A] hover:bg-[#E0E7FF]"
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
                                    <Plus className="h-4 w-4 text-[#6B7280]" />
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Today's Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today's Appointments Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {lawyers.map((lawyer) => {
              const lawyerAppointments = dayAppointments.filter(apt => apt.lawyerId === lawyer.id);
              return (
                <div key={lawyer.id} className="border border-[#E5E7EB] rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
                      lawyer.color
                    )}>
                      {lawyer.initials}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{lawyer.name}</p>
                      <p className="text-xs text-[#6B7280]">
                        {lawyerAppointments.length} appointments
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {lawyerAppointments.length === 0 ? (
                      <p className="text-xs text-[#6B7280]">No appointments today</p>
                    ) : (
                      lawyerAppointments.map((apt) => (
                        <div key={apt.id} className="text-xs">
                          <div className="font-medium">{apt.time} - {apt.clientName}</div>
                          <div className="text-[#6B7280]">{apt.type}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const ReceptionCalendar = () => {
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
      onAppointmentCreate={handleAppointmentCreate}
      onAppointmentEdit={handleAppointmentEdit}
      onAppointmentDelete={handleAppointmentDelete}
    />
  );
};

export default ReceptionCalendar;