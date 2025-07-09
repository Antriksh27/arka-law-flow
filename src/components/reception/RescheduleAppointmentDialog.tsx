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
      // First, mark the current appointment as cancelled
      const { error: cancelError } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          notes: appointment.notes ? 
            `${appointment.notes}\n\nCancelled due to reschedule: ${data.reschedule_reason || 'No reason provided'}` : 
            `Cancelled due to reschedule: ${data.reschedule_reason || 'No reason provided'}`
        })
        .eq('id', appointment.id);

      if (cancelError) throw cancelError;

      // Then create a new appointment with the new date/time
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reception-appointments'] });
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