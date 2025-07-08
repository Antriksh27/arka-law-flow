import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, UserPlus, Clock } from 'lucide-react';
import { format } from 'date-fns';
import AddContactDialog from '@/components/reception/AddContactDialog';
import BookAppointmentDialog from '@/components/reception/BookAppointmentDialog';

const ReceptionHome = () => {
  const { user, firmId } = useAuth();
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [bookAppointmentOpen, setBookAppointmentOpen] = useState(false);
  
  // Get today's appointments count
  const { data: todayAppointments } = useQuery({
    queryKey: ['reception-today-appointments', firmId],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('firm_id', firmId)
        .eq('appointment_date', today);
      return data;
    },
    enabled: !!firmId
  });

  // Get contacts count
  const { data: contactsCount } = useQuery({
    queryKey: ['reception-contacts-count', firmId],
    queryFn: async () => {
      const { count } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('firm_id', firmId)
        .eq('converted_to_client', false);
      return count;
    },
    enabled: !!firmId
  });

  // Get lawyers count
  const { data: lawyersCount } = useQuery({
    queryKey: ['reception-lawyers-count', firmId],
    queryFn: async () => {
      const { count } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('firm_id', firmId)
        .in('role', ['lawyer', 'admin']);
      return count;
    },
    enabled: !!firmId
  });

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">Reception Dashboard</h1>
        <p className="text-[#6B7280] mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7280]">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-[#1E3A8A]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#111827]">{todayAppointments?.length || 0}</div>
            <p className="text-xs text-[#6B7280] mt-1">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7280]">Active Lawyers</CardTitle>
            <Users className="h-4 w-4 text-[#1E3A8A]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#111827]">{lawyersCount || 0}</div>
            <p className="text-xs text-[#6B7280] mt-1">Available for appointments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7280]">Pending Contacts</CardTitle>
            <UserPlus className="h-4 w-4 text-[#1E3A8A]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#111827]">{contactsCount || 0}</div>
            <p className="text-xs text-[#6B7280] mt-1">Not yet converted to clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7280]">Current Time</CardTitle>
            <Clock className="h-4 w-4 text-[#1E3A8A]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#111827]">{format(new Date(), 'HH:mm')}</div>
            <p className="text-xs text-[#6B7280] mt-1">Local time</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium text-[#111827]">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start gap-2"
              onClick={() => setBookAppointmentOpen(true)}
            >
              <Calendar className="w-4 h-4" />
              Book New Appointment
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => setAddContactOpen(true)}
            >
              <UserPlus className="w-4 h-4" />
              Add New Contact
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium text-[#111827]">Today's Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-[#E5E7EB]">
                <span className="text-sm text-[#6B7280]">Appointments</span>
                <span className="text-sm font-medium text-[#111827]">{todayAppointments?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#E5E7EB]">
                <span className="text-sm text-[#6B7280]">Pending Contacts</span>
                <span className="text-sm font-medium text-[#111827]">{contactsCount || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-[#6B7280]">Available Lawyers</span>
                <span className="text-sm font-medium text-[#111827]">{lawyersCount || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <AddContactDialog 
        open={addContactOpen} 
        onOpenChange={setAddContactOpen} 
      />
      <BookAppointmentDialog 
        open={bookAppointmentOpen} 
        onOpenChange={setBookAppointmentOpen} 
      />
    </div>
  );
};

export default ReceptionHome;
