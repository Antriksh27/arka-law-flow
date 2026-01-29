import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
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
      
      if (appointment?.lawyer_id && appointment?.status !== updatedData.status) {
        try {
          let clientName = 'Client';
          if (appointment.client_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('full_name')
              .eq('id', appointment.client_id)
              .single();
            clientName = client?.full_name || 'Client';
          }
        } catch (error) {
          console.error('Failed to update appointment:', error);
        }
      }
      
      toast({
        title: "Success",
        description: "Appointment updated successfully!",
      });
      onOpenChange(false);
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

  const handleClose = () => onOpenChange(false);

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="appointment_date"
            rules={{ required: "Date is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} className="bg-white" />
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white">
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

        <FormField
          control={form.control}
          name="duration_minutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (minutes)</FormLabel>
              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                <FormControl>
                  <SelectTrigger className="bg-white">
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
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-white">
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
                  className="bg-white"
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
                  className="bg-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={updateAppointmentMutation.isPending}
          >
            {updateAppointmentMutation.isPending ? 'Updating...' : 'Update Appointment'}
          </Button>
        </div>
      </form>
    </Form>
  );

  // Mobile: iOS-style bottom sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[95vh] rounded-t-3xl p-0 bg-slate-50"
          hideCloseButton
        >
          {/* Drag handle */}
          <div className="flex justify-center py-3">
            <div className="w-10 h-1 bg-muted rounded-full" />
          </div>

          <MobileDialogHeader
            title="Edit Appointment"
            subtitle="Update appointment details"
            onClose={handleClose}
            icon={<CalendarClock className="w-5 h-5 text-primary" />}
            showBorder
          />

          <ScrollArea className="flex-1 h-[calc(95vh-120px)]">
            <div className="px-4 pb-8">
              {formContent}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Standard dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" hideCloseButton>
        <MobileDialogHeader
          title="Edit Appointment"
          subtitle="Update appointment details"
          onClose={handleClose}
          icon={<CalendarClock className="w-5 h-5 text-primary" />}
          showBorder={false}
        />
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default EditAppointmentDialog;