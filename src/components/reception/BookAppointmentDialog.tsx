
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BookAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AppointmentFormData {
  lawyer_id: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  title?: string;
  notes?: string;
  location?: string;
}

const BookAppointmentDialog = ({ open, onOpenChange }: BookAppointmentDialogProps) => {
  const { user, firmId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AppointmentFormData>({
    defaultValues: {
      lawyer_id: '',
      client_name: '',
      client_email: '',
      client_phone: '',
      appointment_date: format(new Date(), 'yyyy-MM-dd'),
      appointment_time: '10:00',
      duration_minutes: 60,
      title: '',
      notes: '',
      location: '',
    },
  });

  // Fetch lawyers for selection
  const { data: lawyers } = useQuery({
    queryKey: ['reception-lawyers', firmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, user_id, full_name, role')
        .eq('firm_id', firmId)
        .in('role', ['lawyer', 'admin', 'junior']);
      if (error) throw error;
      return data;
    },
    enabled: !!firmId && open,
  });

  const bookAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      // First try to find existing client by email
      let clientId = null;
      if (data.client_email) {
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('email', data.client_email)
          .eq('firm_id', firmId)
          .single();
        
        if (existingClient) {
          clientId = existingClient.id;
        } else {
          // Create new client
          const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert({
              full_name: data.client_name,
              email: data.client_email,
              phone: data.client_phone,
              firm_id: firmId,
              created_by: user?.id,
            })
            .select()
            .single();

          if (clientError) throw clientError;
          clientId = newClient.id;
        }
      }

      // Create appointment
      const { error } = await supabase
        .from('appointments')
        .insert({
          lawyer_id: data.lawyer_id,
          client_id: clientId,
          appointment_date: data.appointment_date,
          appointment_time: data.appointment_time,
          duration_minutes: data.duration_minutes,
          title: data.title,
          notes: data.notes,
          location: data.location,
          firm_id: firmId,
          created_by: user?.id,
          created_by_user_id: user?.id,
          type: 'in-person',
          status: 'upcoming',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reception-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['reception-today-appointments'] });
      toast({
        title: "Success",
        description: "Appointment booked successfully!",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error booking appointment:', error);
      toast({
        title: "Error",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AppointmentFormData) => {
    bookAppointmentMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book New Appointment</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="lawyer_id"
              rules={{ required: "Please select a lawyer" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lawyer *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select lawyer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lawyers?.map((lawyer) => (
                        <SelectItem key={lawyer.user_id} value={lawyer.user_id}>
                          {lawyer.full_name || 'Unnamed Lawyer'} ({lawyer.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="client_name"
                rules={{ required: "Client name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter client name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_email"
                rules={{ required: "Client email is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Email *</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Enter email" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="client_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Phone</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel" 
                      placeholder="Enter phone number" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="appointment_date"
                rules={{ required: "Date is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="appointment_time"
                rules={{ required: "Time is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
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
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Legal consultation, Contract review" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Conference Room A, Office" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about the appointment"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={bookAppointmentMutation.isPending}
              >
                {bookAppointmentMutation.isPending ? 'Booking...' : 'Book Appointment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BookAppointmentDialog;
