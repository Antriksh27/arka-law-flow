import React, { useContext } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
import { CalendarClock } from 'lucide-react';
import { DialogContentContext } from '@/hooks/use-dialog';

interface EditAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any;
}

interface EditAppointmentFormData {
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  title?: string;
  notes?: string;
  status: string;
}

const EditAppointmentDialog = ({ open, onOpenChange, appointment }: EditAppointmentDialogProps) => {
  const { closeDialog } = useDialog();
  const isInsideDialog = useContext(DialogContentContext);
  const handleClose = isInsideDialog ? closeDialog : () => onOpenChange?.(false);

  const isMobile = useIsMobile();
  const { firmId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditAppointmentFormData>({
    defaultValues: {
      appointment_date: appointment?.appointment_date || '',
      appointment_time: appointment?.appointment_time || '',
      duration_minutes: appointment?.duration_minutes || 60,
      title: appointment?.title || '',
      notes: appointment?.notes || '',
      status: appointment?.status || 'upcoming',
    },
  });

  React.useEffect(() => {
    if (appointment) {
      form.reset({
        appointment_date: appointment.appointment_date || '',
        appointment_time: appointment.appointment_time || '',
        duration_minutes: appointment.duration_minutes || 60,
        title: appointment.title || '',
        notes: appointment.notes || '',
        status: appointment.status || 'upcoming',
      });
    }
  }, [appointment, form]);

  const updateAppointmentMutation = useMutation({
    mutationFn: async (data: EditAppointmentFormData) => {
      const { error } = await supabase
        .from('appointments')
        .update({
          appointment_date: data.appointment_date,
          appointment_time: data.appointment_time,
          duration_minutes: data.duration_minutes,
          title: data.title,
          notes: data.notes,
          status: data.status,
        })
        .eq('id', appointment.id);

      if (error) throw error;
      return data;
    },
    onSuccess: async (updatedData) => {
      queryClient.invalidateQueries({ queryKey: ['reception-appointments'] });
      toast({
        title: "Success",
        description: "Appointment updated successfully!",
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditAppointmentFormData) => {
    updateAppointmentMutation.mutate(data);
  };

  const fullFormView = (
    <div className={`flex flex-col h-full bg-slate-50`}>
      <MobileDialogHeader
        title="Edit Appointment"
        subtitle="Update appointment details"
        onClose={handleClose}
        icon={<CalendarClock className="w-5 h-5 text-primary" />}
        showBorder
      />

      <ScrollArea className="flex-1">
        <div className="px-4 py-4 pb-32">
          <Form {...form}>
            <form id="edit-appointment-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Scheduling Card */}
              <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4 shadow-sm border border-border/50">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="appointment_date"
                    rules={{ required: "Date is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-slate-600">Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="rounded-xl h-11 bg-slate-50" />
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
                        <FormLabel className="text-sm text-slate-600">Time *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl h-11 bg-slate-50">
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[200px]">
                            {Array.from({ length: 48 }, (_, i) => {
                              const hour = Math.floor(i / 4) + 8;
                              const minute = (i % 4) * 15;
                              if (hour >= 20) return null;
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

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="duration_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-slate-600">Duration</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl h-11 bg-slate-50">
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-slate-600">Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl h-11 bg-slate-50">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="arrived">Arrived</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="rescheduled">Rescheduled</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Details Card */}
              <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4 border border-border/50">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-600">Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Legal consultation, Contract review" 
                          {...field} 
                          className="rounded-xl h-11 bg-slate-50"
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
                      <FormLabel className="text-sm text-slate-600">Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional notes about the appointment"
                          rows={3}
                          {...field} 
                          className="rounded-xl bg-slate-50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4">
                <Button 
                  type="button" 
                  variant="destructive" 
                  className="w-full rounded-2xl h-12 font-bold shadow-lg shadow-red-500/10"
                  onClick={(e) => {
                    e.preventDefault();
                    const currentValues = form.getValues();
                    updateAppointmentMutation.mutate({
                      ...currentValues,
                      status: 'cancelled'
                    });
                  }}
                >
                  Cancel Appointment
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </ScrollArea>

      <div className="p-4 bg-white/80 backdrop-blur-lg border-t border-slate-100 flex gap-3 sticky bottom-0 z-50">

        <Button
          form="edit-appointment-form"
          type="submit"
          disabled={updateAppointmentMutation.isPending}
          className="flex-1 rounded-full h-12 font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg transition-transform active:scale-[0.98]"
        >
          {updateAppointmentMutation.isPending ? 'Saving...' : 'Update Appointment'}
        </Button>
      </div>
    </div>
  );

  if (isInsideDialog) {
    return fullFormView;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0 overflow-hidden" hideCloseButton>
        {fullFormView}
      </DialogContent>
    </Dialog>
  );
};

export default EditAppointmentDialog;
