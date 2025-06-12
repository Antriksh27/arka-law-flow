
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Clock, ClipboardCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';

import { HearingFormData } from './types';
import { useDialog } from '@/hooks/use-dialog';

const hearingSchema = z.object({
  case_id: z.string({ required_error: "Case is required" }),
  hearing_date: z.date({ required_error: "Hearing date is required" }),
  hearing_time: z.string().optional().nullable(),
  court_name: z.string({ required_error: "Court name is required" }),
  bench: z.string().optional().nullable(),
  coram: z.string().optional().nullable(),
  hearing_type: z.enum(['first_hearing', 'evidence', 'argument', 'judgment', 'other'], {
    required_error: "Hearing type is required",
  }),
  status: z.enum(['scheduled', 'adjourned', 'completed', 'cancelled'], {
    required_error: "Status is required",
  }),
  outcome: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const CreateHearingDialog: React.FC = () => {
  const { closeDialog } = useDialog();
  const queryClient = useQueryClient();

  const form = useForm<HearingFormData>({
    resolver: zodResolver(hearingSchema),
    defaultValues: {
      case_id: '',
      hearing_date: new Date(),
      hearing_time: null,
      court_name: '',
      bench: null,
      coram: null,
      hearing_type: 'first_hearing',
      status: 'scheduled',
      outcome: null,
      notes: null,
    },
  });

  // Fetch cases for dropdown
  const { data: cases, isLoading: casesLoading } = useQuery({
    queryKey: ['cases-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title')
        .order('case_title');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Create hearing mutation
  const createHearing = useMutation({
    mutationFn: async (formData: HearingFormData) => {
      const { data, error } = await supabase
        .from('hearings')
        .insert([
          {
            case_id: formData.case_id,
            hearing_date: format(formData.hearing_date, 'yyyy-MM-dd'),
            hearing_time: formData.hearing_time,
            court_name: formData.court_name,
            bench: formData.bench,
            coram: formData.coram,
            hearing_type: formData.hearing_type,
            status: formData.status,
            outcome: formData.outcome,
            notes: formData.notes,
          }
        ])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Hearing scheduled successfully");
      queryClient.invalidateQueries({ queryKey: ['hearings'] });
      closeDialog();
    },
    onError: (error) => {
      console.error("Error creating hearing:", error);
      toast.error("Failed to schedule hearing");
    },
  });

  const onSubmit = (data: HearingFormData) => {
    createHearing.mutate(data);
  };

  return (
    <Dialog open onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Schedule New Hearing</DialogTitle>
          <DialogDescription>
            Add a new court hearing for a case. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="case_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Case</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select case" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {casesLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading cases...
                          </SelectItem>
                        ) : (
                          cases?.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.case_title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hearing_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hearing Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select hearing type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="first_hearing">First Hearing</SelectItem>
                        <SelectItem value="evidence">Evidence</SelectItem>
                        <SelectItem value="argument">Argument</SelectItem>
                        <SelectItem value="judgment">Judgment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hearing_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hearing_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time (optional)</FormLabel>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <FormControl>
                        <Input
                          placeholder="HH:MM AM/PM"
                          className="pl-10"
                          type="time"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="court_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Court Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter court name" {...field} />
                    </FormControl>
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
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="adjourned">Adjourned</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bench"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bench (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter bench" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coram (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter coram" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outcome (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter hearing outcome details"
                      className="min-h-[80px]"
                      {...field}
                      value={field.value || ""}
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
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional notes"
                      className="min-h-[80px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="gap-2"
                disabled={createHearing.isPending}
              >
                {createHearing.isPending && (
                  <span className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full" />
                )}
                <ClipboardCheck className="w-4 h-4 mr-1" />
                Schedule Hearing
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
