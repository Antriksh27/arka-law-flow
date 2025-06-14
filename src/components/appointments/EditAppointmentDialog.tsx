import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useDialog } from '@/hooks/use-dialog';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  title: string;
  appointment_date: string; // Expecting YYYY-MM-DD string
  appointment_time: string;
  duration_minutes: number;
  client_id?: string;
  lawyer_id?: string;
  case_id?: string;
  // 'location' in current EditAppointmentDialog, 'type' in CreateAppointmentDialog
  // For now, we keep 'location' but will style its Select like 'type'
  location: 'in_person' | 'online' | 'phone' | string; // Adjusted to match common values + string for flexibility
  notes?: string;
  status: string;
  // Add 'type' to align with CreateAppointmentDialog or decide on a unified field.
  // For now, assuming 'location' is the field to be styled.
  // If 'type' is to be used, it should be added to Appointment interface and formData
}

interface EditAppointmentDialogProps {
  appointment: Appointment;
  onSuccess: () => void;
}

interface Client {
  id: string;
  full_name: string;
}

interface Case {
  id: string;
  case_title: string;
  case_number: string;
}

interface User {
  id: string;
  full_name: string;
}

export const EditAppointmentDialog: React.FC<EditAppointmentDialogProps> = ({ 
  appointment, 
  onSuccess 
}) => {
  const { closeDialog } = useDialog();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [formData, setFormData] = useState({
    title: appointment.title || '',
    // Ensure appointment_date is a Date object for the Calendar component
    appointment_date: appointment.appointment_date ? parseISO(appointment.appointment_date) : new Date(),
    appointment_time: appointment.appointment_time || '',
    duration_minutes: appointment.duration_minutes || 60,
    client_id: appointment.client_id || '',
    lawyer_id: appointment.lawyer_id || '',
    case_id: appointment.case_id || '',
    location: appointment.location || 'in_person', 
    notes: appointment.notes || '',
    status: appointment.status || 'upcoming'
  });

  useEffect(() => {
    fetchClients();
    fetchCases();
    fetchUsers();
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, full_name')
      .order('full_name');
    setClients(data || []);
  };

  const fetchCases = async () => {
    const { data } = await supabase
      .from('cases')
      .select('id, case_title, case_number')
      .order('case_title');
    setCases(data || []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('role', ['admin', 'lawyer', 'paralegal'])
      .order('full_name');
    setUsers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        title: formData.title,
        appointment_date: format(formData.appointment_date, 'yyyy-MM-dd'),
        appointment_time: formData.appointment_time,
        duration_minutes: Number(formData.duration_minutes),
        client_id: formData.client_id || null,
        lawyer_id: formData.lawyer_id,
        case_id: formData.case_id || null,
        location: formData.location, // This field is 'location'
        notes: formData.notes,
        status: formData.status
      };

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointment.id);

      if (error) throw error;

      toast.success('Appointment updated successfully');
      onSuccess();
      closeDialog();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Values for the 'type'/'location' select. In CreateAppointmentDialog, it's 'type'. Here it's 'location'.
  // We will map 'location' values to the display text.
  const locationTypeOptions = [
    { value: 'in_person', label: 'In-Person Meeting' }, // Matched 'in-person' from CreateDialog
    { value: 'online', label: 'Video Call' },        // 'video-call' in CreateDialog
    { value: 'phone', label: 'Phone Call' },         // 'call' in CreateDialog
    // Add 'other' if it's a possible value for 'location' or if CreateDialog's 'type' logic should be merged
  ];

  return (
    <Dialog open onOpenChange={closeDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-white border-gray-200 overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900">Edit Appointment</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto px-1 max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-4 pr-3">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-gray-900">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Appointment title"
                required
                className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left bg-white border-gray-300 text-gray-900 hover:bg-gray-50">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.appointment_date ? format(formData.appointment_date, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white border-gray-300">
                    <Calendar
                      mode="single"
                      selected={formData.appointment_date}
                      onSelect={(date) => handleInputChange('appointment_date', date || new Date())}
                      initialFocus
                      className="bg-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appointment_time" className="text-sm font-medium text-gray-900">Time *</Label>
                <Input
                  id="appointment_time"
                  type="time"
                  value={formData.appointment_time}
                  onChange={(e) => handleInputChange('appointment_time', e.target.value)}
                  required
                  className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration_minutes" className="text-sm font-medium text-gray-900">Duration (minutes)</Label>
                <Select
                  value={formData.duration_minutes.toString()}
                  onValueChange={(value) => handleInputChange('duration_minutes', parseInt(value))}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="30" className="text-gray-900">30 minutes</SelectItem>
                    <SelectItem value="60" className="text-gray-900">1 hour</SelectItem>
                    <SelectItem value="90" className="text-gray-900">1.5 hours</SelectItem>
                    <SelectItem value="120" className="text-gray-900">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium text-gray-900">Type / Location</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => handleInputChange('location', value)}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue placeholder="Select type/location" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    {locationTypeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-gray-900">
                        {opt.label}
                      </SelectItem>
                    ))}
                     {/* Add an 'Other' option if needed, similar to CreateAppointmentDialog */}
                    <SelectItem value="other" className="text-gray-900">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium text-gray-900">Status</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(value) => handleInputChange('status', value)}
                    >
                        <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500">
                        <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-300">
                        <SelectItem value="upcoming" className="text-gray-900">Upcoming</SelectItem>
                        <SelectItem value="completed" className="text-gray-900">Completed</SelectItem>
                        <SelectItem value="cancelled" className="text-gray-900">Cancelled</SelectItem>
                        <SelectItem value="rescheduled" className="text-gray-900">Rescheduled</SelectItem>
                        <SelectItem value="pending" className="text-gray-900">Pending</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id" className="text-sm font-medium text-gray-900">Client</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => handleInputChange('client_id', value)}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id} className="text-gray-900">
                        {client.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lawyer_id" className="text-sm font-medium text-gray-900">Assigned To *</Label>
                <Select
                  value={formData.lawyer_id}
                  onValueChange={(value) => handleInputChange('lawyer_id', value)}
                  required
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id} className="text-gray-900">
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="case_id" className="text-sm font-medium text-gray-900">Related Case (Optional)</Label>
              <Select
                value={formData.case_id}
                onValueChange={(value) => handleInputChange('case_id', value)}
              >
                <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Select case" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  {cases.map((case_) => (
                    <SelectItem key={case_.id} value={case_.id} className="text-gray-900">
                      {case_.case_title} ({case_.case_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium text-gray-900">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes or agenda items..."
                rows={3}
                className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white border-t border-gray-200 pb-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={closeDialog} 
                className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Appointment'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
