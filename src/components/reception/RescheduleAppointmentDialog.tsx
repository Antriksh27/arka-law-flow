import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
import { sendAppointmentNotification } from '@/lib/appointmentNotifications';

interface RescheduleAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any;
}

interface RescheduleFormData {
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  reschedule_reason?: string;
}

const RescheduleAppointmentDialog = ({ open, onOpenChange, appointment }: RescheduleAppointmentDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RescheduleFormData>({
    defaultValues: {
      appointment_date: appointment?.appointment_date || '',
      appointment_time: appointment?.appointment_time || '',
      duration_minutes: appointment?.duration_minutes || 60,
      reschedule_reason: '',
    },
  });

  React.useEffect(() => {
    if (appointment) {
      form.reset({
        appointment_date: appointment.appointment_date || '',
        appointment_time: appointment.appointment_time || '',
        duration_minutes: appointment.duration_minutes || 60,
        reschedule_reason: '',
      });
    }
  }, [appointment, form]);

  const rescheduleAppointmentMutation = useMutation({
    mutationFn: async (data: RescheduleFormData) => {
      const dateChanged = data.appointment_date !== appointment.appointment_date;
      
      if (dateChanged) {
        // If date changed, mark original as rescheduled and create new appointment
        const { error: rescheduleError } = await supabase
          .from('appointments')
          .update({
            status: 'rescheduled',
            notes: appointment.notes ? 
              `${appointment.notes}\n\nRescheduled to ${data.appointment_date} at ${data.appointment_time}: ${data.reschedule_reason || 'No reason provided'}` : 
              `Rescheduled to ${data.appointment_date} at ${data.appointment_time}: ${data.reschedule_reason || 'No reason provided'}`
          })
          .eq('id', appointment.id);

        if (rescheduleError) throw rescheduleError;

        // Create new appointment
        const { error: createError } = await supabase
          .from('appointments')
          .insert({
            client_id: appointment.client_id,
            lawyer_id: appointment.lawyer_id,
            case_id: appointment.case_id,
            appointment_date: data.appointment_date,
            appointment_time: data.appointment_time,
            duration_minutes: data.duration_minutes,
            title: appointment.title,
            location: appointment.location,
            notes: `Rescheduled from ${appointment.appointment_date} ${appointment.appointment_time}. Reason: ${data.reschedule_reason || 'No reason provided'}`,
            status: 'upcoming',
            firm_id: appointment.firm_id,
            created_by_user_id: appointment.created_by_user_id,
            type: appointment.type || 'consultation'
          });

        if (createError) throw createError;
        return { type: 'date_changed', data };
      } else {
        // If only time changed, update as rescheduled
        const { error } = await supabase
          .from('appointments')
          .update({
            appointment_time: data.appointment_time,
            duration_minutes: data.duration_minutes,
            status: 'rescheduled',
            notes: appointment.notes ? 
              `${appointment.notes}\n\nRescheduled time: ${data.reschedule_reason || 'No reason provided'}` : 
              `Rescheduled time: ${data.reschedule_reason || 'No reason provided'}`
          })
          .eq('id', appointment.id);

        if (error) throw error;
        return { type: 'time_changed', data };
      }
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['reception-appointments'] });
      
      // Send notification for reschedule
      if (appointment?.lawyer_id) {
        try {
          // Get client name for notification
          let clientName = 'Client';
          if (appointment.client_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('full_name')
              .eq('id', appointment.client_id)
              .single();
            clientName = client?.full_name || 'Client';
          }

          const message = result.type === 'date_changed' 
            ? `${clientName}'s appointment has been rescheduled from ${appointment.appointment_date} to ${result.data.appointment_date} at ${result.data.appointment_time?.slice(0, 5) || 'N/A'}`
            : `${clientName}'s appointment time has been changed to ${result.data.appointment_time?.slice(0, 5) || 'N/A'}`;

          await sendAppointmentNotification({
            type: 'updated',
            appointment_id: appointment.id,
            lawyer_id: appointment.lawyer_id,
            title: 'Appointment Rescheduled',
            message,
            metadata: { 
              old_date: appointment.appointment_date,
              old_time: appointment.appointment_time,
              new_date: result.data.appointment_date,
              new_time: result.data.appointment_time,
              reason: result.data.reschedule_reason,
              client_name: clientName,
              change_type: result.type
            }
          });
        } catch (error) {
          console.error('Failed to send reschedule notification:', error);
        }
      }
      
      toast({
        title: "Success",
        description: "Appointment rescheduled successfully!",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error rescheduling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to reschedule appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RescheduleFormData) => {
    rescheduleAppointmentMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="appointment_date"
                rules={{ required: "New date is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Date *</FormLabel>
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
                rules={{ required: "New time is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Time *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[200px]">
                        {Array.from({ length: 48 }, (_, i) => {
                          const hour = Math.floor(i / 4) + 8; // Start from 8 AM
                          const minute = (i % 4) * 15;
                          if (hour >= 20) return null; // Stop at 8 PM
                          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                          const displayTime = `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
                          return (
                            <SelectItem key={timeString} value={timeString}>
                              {displayTime}
                            </SelectItem>
                          );
                        }).filter(Boolean)}
                      </SelectContent>
                    </Select>
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
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
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
              name="reschedule_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Rescheduling</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please provide a reason for rescheduling"
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
                disabled={rescheduleAppointmentMutation.isPending}
              >
                {rescheduleAppointmentMutation.isPending ? 'Rescheduling...' : 'Reschedule Appointment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleAppointmentDialog;