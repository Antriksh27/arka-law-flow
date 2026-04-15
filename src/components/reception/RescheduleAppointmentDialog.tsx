import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Clock, Edit2, Loader2 } from 'lucide-react';
import { useContext } from 'react';
import { DialogContentContext, useDialog } from '@/hooks/use-dialog';
import { MobileDialogHeader } from '@/components/ui/mobile-dialog-header';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { SmartBookingCalendar } from '@/components/appointments/SmartBookingCalendar';
import { format } from 'date-fns';

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
  const { user, firmId } = useAuth();
  const queryClient = useQueryClient();
  const { closeDialog } = useDialog();
  const isInsideDialog = useContext(DialogContentContext);
  const handleClose = isInsideDialog ? closeDialog : () => onOpenChange?.(false);

  // Get current user's role to enable override for receptionists
  const { data: currentUserRole } = useQuery({
    queryKey: ['current-user-role', user?.id],
    queryFn: async () => {
      if (!user?.id || !firmId) return null;
      
      const { data, error } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('firm_id', firmId)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }
      
      return data?.role;
    },
    enabled: !!user?.id && !!firmId
  });

  // Allow override for receptionists and office staff
  const allowOverride = currentUserRole === 'receptionist' || currentUserRole === 'office_staff';

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
      
      toast({
        title: "Success",
        description: "Appointment rescheduled successfully!",
      });
      handleClose();
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

  const fullFormView = (
    <div className="flex flex-col h-full bg-slate-50">
      <MobileDialogHeader
        title="Reschedule"
        subtitle="Select a new date and time for this appointment."
        onClose={handleClose}
        icon={<Clock className="w-5 h-5 text-primary" />}
        showBorder
      />

      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden">
                <div className="p-4">
                  <SmartBookingCalendar
                    selectedLawyer={appointment?.lawyer_id || null}
                    selectedDate={form.watch('appointment_date') ? new Date(form.watch('appointment_date')) : undefined}
                    selectedTime={form.watch('appointment_time')}
                    hideLawyerPicker
                    allowOverride={allowOverride}
                    onTimeSlotSelect={(date, time, duration) => {
                      form.setValue('appointment_date', format(date, 'yyyy-MM-dd'));
                      form.setValue('appointment_time', time);
                      form.setValue('duration_minutes', duration);
                    }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden p-4 space-y-4">
                <FormField
                  control={form.control}
                  name="duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger disabled className="h-12 bg-slate-50 border-0 rounded-xl opacity-70">
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
                      <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reason for Rescheduling</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please provide a reason for rescheduling"
                          className="bg-slate-50 border-0 rounded-2xl resize-none"
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>
      </ScrollArea>

      <div className="p-4 bg-white/80 backdrop-blur-lg border-t border-slate-100 flex gap-3">

        <Button 
          type="submit" 
          onClick={form.handleSubmit(onSubmit)}
          disabled={rescheduleAppointmentMutation.isPending}
          className="flex-1 rounded-full h-12 font-bold shadow-lg"
        >
          {rescheduleAppointmentMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Rescheduling...
            </>
          ) : (
            'Reschedule'
          )}
        </Button>
      </div>
    </div>
  );

  if (isInsideDialog) {
    return fullFormView;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent hideCloseButton className="sm:max-w-[500px] p-0 gap-0 overflow-hidden max-h-[95vh] sm:max-h-[90vh] rounded-3xl">
        {fullFormView}
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleAppointmentDialog;
