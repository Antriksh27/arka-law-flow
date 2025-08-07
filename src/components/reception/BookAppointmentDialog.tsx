import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Plus, Check, ChevronsUpDown } from 'lucide-react';
import { sendAppointmentNotification } from '@/lib/appointmentNotifications';
interface BookAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
interface AppointmentFormData {
  lawyer_id: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_address?: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  title?: string;
  notes?: string;
}
const BookAppointmentDialog = ({
  open,
  onOpenChange
}: BookAppointmentDialogProps) => {
  const {
    user,
    firmId
  } = useAuth();
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [showAddContact, setShowAddContact] = useState(false);
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [selectedClientValue, setSelectedClientValue] = useState('');
  const form = useForm<AppointmentFormData>({
    defaultValues: {
      lawyer_id: '',
      client_name: '',
      client_email: '',
      client_phone: '',
      client_address: '',
      appointment_date: format(new Date(), 'yyyy-MM-dd'),
      appointment_time: '10:00',
      duration_minutes: 60,
      title: '',
      notes: ''
    }
  });

  // Fetch lawyers for selection
  const {
    data: lawyers
  } = useQuery({
    queryKey: ['reception-lawyers', firmId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('team_members').select('id, user_id, full_name, role').eq('firm_id', firmId).in('role', ['lawyer', 'admin', 'junior']);
      if (error) throw error;

      // Sort to always show "chitrajeet upadhyaya" first
      return data?.sort((a, b) => {
        const nameA = a.full_name?.toLowerCase() || '';
        const nameB = b.full_name?.toLowerCase() || '';
        if (nameA.includes('chitrajeet upadhyaya')) return -1;
        if (nameB.includes('chitrajeet upadhyaya')) return 1;
        return nameA.localeCompare(nameB);
      }) || [];
    },
    enabled: !!firmId && open
  });

  // Fetch clients and contacts for selection
  const {
    data: clientsAndContacts
  } = useQuery({
    queryKey: ['clients-contacts', firmId],
    queryFn: async () => {
      const [clientsResponse, contactsResponse] = await Promise.all([supabase.from('clients').select('id, full_name, email, phone, address').eq('firm_id', firmId).order('full_name'), supabase.from('contacts').select('id, name, email, phone, address_line_1, address_line_2, visit_purpose, notes').eq('firm_id', firmId).order('name')]);
      if (clientsResponse.error) throw clientsResponse.error;
      if (contactsResponse.error) throw contactsResponse.error;
      const clients = clientsResponse.data?.map(client => ({
        id: client.id,
        name: client.full_name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        type: 'client' as const,
        additionalInfo: null
      })) || [];
      const contacts = contactsResponse.data?.map(contact => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        address: contact.address_line_1 ? [contact.address_line_1, contact.address_line_2].filter(Boolean).join(', ') : null,
        type: 'contact' as const,
        additionalInfo: {
          visit_purpose: contact.visit_purpose,
          notes: contact.notes
        }
      })) || [];
      return [...clients, ...contacts];
    },
    enabled: !!firmId && open
  });
  const handleClientSelection = (selectedValue: string) => {
    if (selectedValue === 'add-new') {
      setShowAddContact(true);
      setSelectedClientValue('add-new');
      form.setValue('client_name', '');
      form.setValue('client_email', '');
      form.setValue('client_phone', '');
      setClientSearchOpen(false);
      return;
    }
    const selectedClient = clientsAndContacts?.find(item => `${item.type}-${item.id}` === selectedValue);
    if (selectedClient) {
      form.setValue('client_name', selectedClient.name);
      form.setValue('client_email', selectedClient.email || '');
      form.setValue('client_phone', selectedClient.phone || '');

      // Set additional fields if they exist on the form
      if (selectedClient.address) {
        form.setValue('client_address', selectedClient.address);
      }

      // If it's a contact with additional info, set visit purpose as notes
      if (selectedClient.type === 'contact' && selectedClient.additionalInfo?.visit_purpose) {
        form.setValue('notes', selectedClient.additionalInfo.visit_purpose);
      }
      setSelectedClientValue(selectedValue);
      setShowAddContact(false);
      setClientSearchOpen(false);
    }
  };
  const getSelectedClientDisplay = () => {
    if (showAddContact) return 'Add New Contact';
    if (selectedClientValue && selectedClientValue !== 'add-new') {
      const selectedClient = clientsAndContacts?.find(item => `${item.type}-${item.id}` === selectedClientValue);
      return selectedClient ? selectedClient.name : 'Select client or contact';
    }
    return 'Select client or contact';
  };
  const bookAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      console.log('🚀 BookAppointmentDialog: Creating appointment with data:', data);
      console.log('🔍 Selected client value:', selectedClientValue);
      
      // Only use client_id if an existing client was selected
      let clientId = null;
      if (selectedClientValue && selectedClientValue.startsWith('client-')) {
        clientId = selectedClientValue.replace('client-', '');
        console.log('📝 Using existing client ID:', clientId);
      } else {
        console.log('📝 No existing client selected - appointment will be created without client_id');
      }

      // Create appointment - store client name directly for contacts
      const appointmentData: any = {
        lawyer_id: data.lawyer_id,
        appointment_date: data.appointment_date,
        appointment_time: data.appointment_time,
        duration_minutes: data.duration_minutes,
        title: data.title || `Appointment with ${data.client_name}`,
        notes: data.notes,
        firm_id: firmId,
        created_by: user?.id,
        created_by_user_id: user?.id,
        type: 'in-person',
        status: 'upcoming'
      };

      // Only set client_id if an existing client was selected
      if (clientId) {
        appointmentData.client_id = clientId;
      }

      console.log('📅 Creating appointment with data:', appointmentData);

      const {
        data: newAppointment,
        error
      } = await supabase.from('appointments').insert(appointmentData).select().single();
      if (error) throw error;
      return {
        appointment: newAppointment,
        clientName: data.client_name
      };
    },
    onSuccess: async result => {
      queryClient.invalidateQueries({
        queryKey: ['reception-appointments']
      });
      queryClient.invalidateQueries({
        queryKey: ['reception-today-appointments']
      });

      // Send notification for new appointment
      if (result?.appointment?.lawyer_id) {
        try {
          await sendAppointmentNotification({
            type: 'created',
            appointment_id: result.appointment.id,
            lawyer_id: result.appointment.lawyer_id,
            title: 'New Appointment Scheduled',
            message: `New appointment scheduled with ${result.clientName} on ${result.appointment.appointment_date} at ${result.appointment.appointment_time?.slice(0, 5) || 'N/A'}`,
            metadata: {
              client_name: result.clientName,
              appointment_date: result.appointment.appointment_date,
              appointment_time: result.appointment.appointment_time,
              title: result.appointment.title
            }
          });
        } catch (error) {
          console.error('Failed to send new appointment notification:', error);
        }
      }
      toast({
        title: "Success",
        description: "Appointment booked successfully!"
      });
      form.reset();
      onOpenChange(false);
    },
    onError: error => {
      console.error('Error booking appointment:', error);
      toast({
        title: "Error",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive"
      });
    }
  });
  const onSubmit = (data: AppointmentFormData) => {
    bookAppointmentMutation.mutate(data);
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book New Appointment</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="lawyer_id" rules={{
            required: "Please select a lawyer"
          }} render={({
            field
          }) => <FormItem>
                  <FormLabel>Lawyer *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select lawyer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lawyers?.map(lawyer => <SelectItem key={lawyer.user_id} value={lawyer.user_id}>
                          {lawyer.full_name || 'Unnamed Lawyer'} ({lawyer.role})
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>} />

            <FormField control={form.control} name="client_name" rules={{
            required: "Client selection is required"
          }} render={({
            field
          }) => <FormItem className="flex flex-col">
                  <FormLabel>Client/Contact *</FormLabel>
                  <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" role="combobox" aria-expanded={clientSearchOpen} className="w-full justify-between">
                          {getSelectedClientDisplay()}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-white border border-gray-200 shadow-lg z-50" align="start">
                      <Command>
                        <CommandInput placeholder="Search clients and contacts..." />
                        <CommandList>
                          <CommandEmpty>No client or contact found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem value="add-new" onSelect={() => handleClientSelection('add-new')}>
                              <div className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Add New Contact
                              </div>
                            </CommandItem>
                            {clientsAndContacts?.map(item => <CommandItem key={`${item.type}-${item.id}`} value={`${item.name} ${item.email || ''} ${item.type}`} onSelect={() => handleClientSelection(`${item.type}-${item.id}`)}>
                                <Check className={`mr-2 h-4 w-4 ${selectedClientValue === `${item.type}-${item.id}` ? "opacity-100" : "opacity-0"}`} />
                                <div className="flex flex-col">
                                  <span>{item.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {item.email || 'No email'} • {item.type === 'client' ? 'Client' : 'Contact'}
                                  </span>
                                </div>
                              </CommandItem>)}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>} />

            {showAddContact && <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <h4 className="font-medium text-sm">Add New Contact</h4>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="client_name" rules={{
                required: "Client name is required"
              }} render={({
                field
              }) => <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="client_email" rules={{
                required: "Client email is required"
              }} render={({
                field
              }) => <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                </div>

                <FormField control={form.control} name="client_phone" render={({
              field
            }) => <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
              </div>}

            {!showAddContact && <>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="client_email" render={({
                field
              }) => <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Auto-populated from selection" {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="client_phone" render={({
                field
              }) => <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="Auto-populated from selection" {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                </div>

                <FormField control={form.control} name="client_address" render={({
              field
            }) => <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Auto-populated from selection" {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
              </>}

            {/* Show contact details in a info box when selected */}
            {!showAddContact && selectedClientValue && selectedClientValue !== 'add-new'}

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="appointment_date" rules={{
              required: "Date is required"
            }} render={({
              field
            }) => <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="appointment_time" rules={{
              required: "Time is required"
            }} render={({
              field
            }) => <FormItem>
                    <FormLabel>Time *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[200px]">
                        {Array.from({
                    length: 48
                  }, (_, i) => {
                    const hour = Math.floor(i / 4) + 8; // Start from 8 AM
                    const minute = i % 4 * 15;
                    if (hour >= 20) return null; // Stop at 8 PM
                    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    const displayTime = `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
                    return <SelectItem key={timeString} value={timeString}>
                              {displayTime}
                            </SelectItem>;
                  }).filter(Boolean)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>} />
            </div>

            <FormField control={form.control} name="duration_minutes" render={({
            field
          }) => <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <Select onValueChange={value => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>} />

            <FormField control={form.control} name="title" render={({
            field
          }) => <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Legal consultation, Contract review" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />


            <FormField control={form.control} name="notes" render={({
            field
          }) => <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes about the appointment" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={bookAppointmentMutation.isPending}>
                {bookAppointmentMutation.isPending ? 'Booking...' : 'Book Appointment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>;
};
export default BookAppointmentDialog;