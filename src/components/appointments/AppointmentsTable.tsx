
import React, { useEffect, useState } from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { 
  Clock, 
  Check, 
  Video, 
  MapPin, 
  Phone, 
  MoreVertical, 
  Edit2, 
  Calendar, 
  Trash 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDialog } from '@/hooks/use-dialog';
import { EditAppointmentDialog } from './EditAppointmentDialog';
import { FilterState } from '../../pages/Appointments';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  title: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  client_name: string;
  case_title: string;
  assigned_user_name: string;
  status: string;
  location: string;
  notes?: string;
}

interface AppointmentsTableProps {
  filters: FilterState;
}

export const AppointmentsTable: React.FC<AppointmentsTableProps> = ({ filters }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { openDialog } = useDialog();

  useEffect(() => {
    fetchAppointments();
  }, [filters]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('appointment_details')
        .select('*')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (filters.searchQuery) {
        query = query.or(`client_name.ilike.%${filters.searchQuery}%,case_title.ilike.%${filters.searchQuery}%,notes.ilike.%${filters.searchQuery}%`);
      }

      if (filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching appointments:', error);
        return;
      }

      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Upcoming</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge><Clock className="w-3 h-3 mr-1" />Upcoming</Badge>;
    }
  };

  const getLocationIcon = (location: string) => {
    switch (location?.toLowerCase()) {
      case 'online':
        return <Video className="w-4 h-4 text-gray-400" />;
      case 'phone':
        return <Phone className="w-4 h-4 text-gray-400" />;
      case 'in_person':
      default:
        return <MapPin className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDateTime = (date: string, time: string) => {
    if (!date) return 'Not set';
    
    try {
      const dateObj = new Date(date);
      let formattedDate = '';
      
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (dateObj.toDateString() === today.toDateString()) {
        formattedDate = 'Today';
      } else if (dateObj.toDateString() === tomorrow.toDateString()) {
        formattedDate = 'Tomorrow';
      } else if (dateObj.toDateString() === yesterday.toDateString()) {
        formattedDate = 'Yesterday';
      } else {
        formattedDate = format(dateObj, 'MMM dd, yyyy');
      }
      
      const formattedTime = time ? format(new Date(`2000-01-01T${time}`), 'h:mm a') : '';
      
      return { date: formattedDate, time: formattedTime };
    } catch (error) {
      return { date: date, time: time || '' };
    }
  };

  const handleEdit = (appointment: Appointment) => {
    openDialog(
      <EditAppointmentDialog 
        appointment={appointment} 
        onSuccess={fetchAppointments}
      />
    );
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) {
        console.error('Error cancelling appointment:', error);
        return;
      }

      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500">Loading appointments...</div>
      </div>
    );
  }

  return (
    <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Case</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Location</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No appointments found
              </TableCell>
            </TableRow>
          ) : (
            appointments.map((appointment) => {
              const { date, time } = formatDateTime(appointment.appointment_date, appointment.appointment_time);
              
              return (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-sm font-semibold text-gray-700">
                        {date}, {time}
                      </span>
                      <span className="text-xs text-gray-500">
                        {appointment.duration_minutes} minutes
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="whitespace-nowrap text-sm text-gray-600">
                      {appointment.client_name || 'Not assigned'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="whitespace-nowrap text-sm text-gray-600">
                      {appointment.case_title || 'No case linked'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {appointment.assigned_user_name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-600">
                        {appointment.assigned_user_name || 'Unassigned'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(appointment.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getLocationIcon(appointment.location)}
                      <span className="text-sm text-gray-600">
                        {appointment.location === 'online' ? 'Video Call' : 
                         appointment.location === 'phone' ? 'Phone Call' : 
                         appointment.location === 'in_person' ? 'Office' : 
                         appointment.location || 'Not specified'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex grow shrink-0 basis-0 items-center justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(appointment)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calendar className="h-4 w-4 mr-2" />
                            Reschedule
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleCancel(appointment.id)}
                            className="text-red-600"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Cancel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
