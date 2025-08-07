import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Users, UserPlus, Search, MoreHorizontal, User, Video, MapPin, Edit2, CalendarPlus, Briefcase, LayoutList } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import AddContactDialog from '@/components/reception/AddContactDialog';
import BookAppointmentDialog from '@/components/reception/BookAppointmentDialog';
import EditContactDialog from '@/components/reception/EditContactDialog';
const ReceptionHome = () => {
  const {
    user,
    firmId
  } = useAuth();
  const navigate = useNavigate();
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [bookAppointmentOpen, setBookAppointmentOpen] = useState(false);
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Get today's appointments
  const {
    data: todayAppointments
  } = useQuery({
    queryKey: ['reception-today-appointments', firmId],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('firm_id', firmId)
        .eq('appointment_date', today)
        .order('appointment_time', { ascending: true });

      if (error) throw error;

      // Get client and lawyer names separately
      const enrichedAppointments = await Promise.all(
        (data || []).map(async (appointment) => {
          let clientName = null;
          let lawyerName = null;

          // Get client name if client_id exists
          if (appointment.client_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('full_name')
              .eq('id', appointment.client_id)
              .single();
            clientName = client?.full_name;
          }

          // Get lawyer name if lawyer_id exists
          if (appointment.lawyer_id) {
            const { data: lawyer } = await supabase
              .from('team_members')
              .select('full_name')
              .eq('user_id', appointment.lawyer_id)
              .single();
            lawyerName = lawyer?.full_name;
          }

          return {
            ...appointment,
            clients: clientName ? [{ full_name: clientName }] : [],
            team_members: lawyerName ? [{ full_name: lawyerName }] : []
          };
        })
      );

      return enrichedAppointments;
    },
    enabled: !!firmId
  });

  // Get lawyers with appointment counts
  const {
    data: lawyers
  } = useQuery({
    queryKey: ['reception-lawyers', firmId],
    queryFn: async () => {
      const {
        data
      } = await supabase.from('team_members').select('id, user_id, full_name, role').eq('firm_id', firmId).in('role', ['lawyer', 'admin', 'junior']);
      
      // Sort to always show "chitrajeet upadhyaya" first
      return data?.sort((a, b) => {
        const nameA = a.full_name?.toLowerCase() || '';
        const nameB = b.full_name?.toLowerCase() || '';
        
        if (nameA.includes('chitrajeet upadhyaya')) return -1;
        if (nameB.includes('chitrajeet upadhyaya')) return 1;
        return nameA.localeCompare(nameB);
      }) || [];
    },
    enabled: !!firmId
  });

  // Get recent contacts
  const {
    data: recentContacts
  } = useQuery({
    queryKey: ['reception-recent-contacts', firmId],
    queryFn: async () => {
      const {
        data
      } = await supabase.from('contacts').select('*').eq('firm_id', firmId).eq('converted_to_client', false).order('created_at', {
        ascending: false
      }).limit(5);
      return data || [];
    },
    enabled: !!firmId
  });
  const getAppointmentTypeIcon = (type: string) => {
    switch (type) {
      case 'video-call':
        return <Video className="w-4 h-4" />;
      case 'in-person':
        return <MapPin className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'upcoming':
        return 'default';
      default:
        return 'outline';
    }
  };
  return <div className="container max-w-none flex h-full w-full flex-col items-start gap-6 bg-[#F9FAFB] py-12 overflow-auto">
      {/* Header */}
      <div className="flex w-full items-center gap-4">
        <div className="flex grow shrink-0 basis-0 items-center gap-4">
          
          
        </div>
        <Button className="gap-2" onClick={() => setAddContactOpen(true)}>
          <UserPlus className="w-4 h-4" />
          New Contact
        </Button>
        <Button className="gap-2" onClick={() => setBookAppointmentOpen(true)}>
          <CalendarPlus className="w-4 h-4" />
          New Appointment
        </Button>
      </div>

      <div className="flex w-full items-start gap-6">
        {/* Sidebar */}
        <div className="flex w-64 flex-none flex-col items-start gap-4">
          {/* Lawyers Section */}
          <Card className="w-full">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Lawyers</h3>
              <div className="flex flex-col gap-2">
                {lawyers?.map(lawyer => <div key={lawyer.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-[#F3F4F6]">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {lawyer.full_name?.charAt(0) || 'L'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-medium text-[#111827]">
                      {lawyer.full_name || 'Unnamed Lawyer'}
                    </span>
                     <Badge variant="outline" className="text-xs">
                       {lawyer.role}
                     </Badge>
                  </div>)}
              </div>
            </CardContent>
          </Card>

          {/* Filters Section */}
          <Card className="w-full">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Filters</h3>
              <div className="flex flex-col gap-2">
                <Button variant="ghost" className="justify-start h-8 text-sm">
                  Today
                </Button>
                <Button variant="ghost" className="justify-start h-8 text-sm">
                  This Week
                </Button>
                <Button variant="ghost" className="justify-start h-8 text-sm">
                  Pending
                </Button>
                <Button variant="ghost" className="justify-start h-8 text-sm">
                  Confirmed
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
          {/* Search and View Toggle */}
          <div className="flex w-full items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280] w-4 h-4" />
              <Input placeholder="Search appointments..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <LayoutList className="w-4 h-4" />
                List
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Calendar className="w-4 h-4" />
                Calendar
              </Button>
            </div>
          </div>

          {/* Today's Appointments */}
          <Card className="w-full">
            <CardContent className="p-0">
              <div className="p-4 border-b border-[#E5E7EB]">
                <h3 className="text-lg font-semibold text-[#111827]">
                  Today's Appointments
                </h3>
              </div>
              <div className="divide-y divide-[#E5E7EB]">
                 {todayAppointments?.length > 0 ? todayAppointments.map(appointment => <div key={appointment.id} className="flex items-center gap-4 p-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-sm font-semibold text-[#111827]">
                          {appointment.appointment_time ? appointment.appointment_time.slice(0, 5) : 'Time not set'}
                        </span>
                        <span className="text-xs text-[#6B7280]">
                          {appointment.duration_minutes} min
                        </span>
                      </div>
                      <div className="w-1 h-12 bg-[#1E3A8A] rounded-full" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-[#111827]">
                            {appointment.title || 'Appointment'}
                          </span>
                          <Badge variant={getStatusVariant(appointment.status)} className="text-xs">
                            {appointment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-[#6B7280]" />
                            <span className="text-xs text-[#111827]">
                              {appointment.clients?.[0]?.full_name || 'Unknown Client'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {getAppointmentTypeIcon(appointment.type)}
                            <span className="text-xs text-[#111827]">
                              {appointment.type === 'video-call' ? 'Virtual' : 'In Person'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>) : <div className="p-8 text-center text-[#6B7280]">
                    No appointments scheduled for today
                  </div>}
              </div>
            </CardContent>
          </Card>

          {/* Recent Contacts */}
          <Card className="w-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#111827]">
                  Recent Contacts
                </h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/reception/contacts')}>
                  View All
                </Button>
              </div>
              <div className="divide-y divide-[#E5E7EB]">
                {recentContacts?.length > 0 ? recentContacts.map(contact => <div key={contact.id} className="flex items-center gap-4 py-4">
                      <Avatar>
                        <AvatarFallback>
                          {contact.name?.charAt(0) || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-[#111827]">
                          {contact.name}
                        </div>
                        <div className="text-xs text-[#6B7280]">
                          {contact.visit_purpose || 'General Inquiry'}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => {
                          setSelectedContact(contact);
                          setEditContactOpen(true);
                        }}
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </Button>
                    </div>) : <div className="py-8 text-center text-[#6B7280]">
                    No recent contacts
                  </div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <AddContactDialog open={addContactOpen} onOpenChange={setAddContactOpen} />
      <BookAppointmentDialog open={bookAppointmentOpen} onOpenChange={setBookAppointmentOpen} />
      <EditContactDialog 
        open={editContactOpen} 
        onOpenChange={setEditContactOpen}
        contact={selectedContact}
      />
    </div>;
};
export default ReceptionHome;