
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import TimeUtils from '@/lib/timeUtils';
import { useDialog } from '@/hooks/use-dialog';
import { useToast } from '@/hooks/use-toast';
import { HearingFormData, HearingType, HearingStatus } from './types';

export const CreateHearingDialog: React.FC = () => {
  const { closeDialog } = useDialog();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<HearingFormData>({
    case_id: '',
    hearing_date: TimeUtils.nowDate(),
    hearing_time: '12:00',
    court_name: '',
    bench: '',
    coram: '',
    hearing_type: 'preliminary',
    status: 'scheduled',
    outcome: '',
    notes: '',
  });

  // Fetch cases for the dropdown
  const { data: cases } = useQuery({
    queryKey: ['cases-for-hearing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title, case_number')
        .order('case_title');
      
      if (error) throw error;
      return data || [];
    }
  });

  const createHearingMutation = useMutation({
    mutationFn: async (data: HearingFormData) => {
      const { data: userData } = await supabase.auth.getUser();
      
      // Get user's firm_id
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('firm_id')
        .eq('user_id', userData.user?.id)
        .single();

      if (!teamMember?.firm_id) {
        throw new Error('Unable to determine firm');
      }
      
      const hearingData = {
        case_id: data.case_id,
        hearing_date: typeof data.hearing_date === 'string' 
          ? data.hearing_date 
          : TimeUtils.formatDateInput(data.hearing_date),
        hearing_time: data.hearing_time || null,
        court_name: data.court_name,
        bench: data.bench || null,
        coram: data.coram || null,
        hearing_type: data.hearing_type,
        status: data.status,
        outcome: data.outcome || null,
        notes: data.notes || null,
        created_by: userData.user?.id,
        firm_id: teamMember.firm_id,
      };

      const { data: result, error } = await supabase
        .from('case_hearings')
        .insert(hearingData)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-hearings'] });
      queryClient.invalidateQueries({ queryKey: ['case-hearings'] });
      toast({
        title: "Success",
        description: "Hearing created successfully",
      });
      closeDialog();
    },
    onError: (error) => {
      console.error('Error creating hearing:', error);
      toast({
        title: "Error",
        description: "Failed to create hearing",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.case_id || !formData.court_name) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createHearingMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof HearingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={closeDialog}>
      <DialogContent hideCloseButton className="sm:max-w-2xl p-0 gap-0 flex flex-col overflow-hidden">
        <div className="flex flex-col h-full min-h-0 bg-muted">
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-5 bg-background border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold text-foreground">Create New Hearing</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Schedule a new court hearing</p>
              </div>
              <button 
                onClick={closeDialog}
                className="sm:hidden w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <span className="sr-only">Close</span>
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Case & Type Card */}
              <div className="bg-background rounded-2xl shadow-sm p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="case" className="text-foreground">Case *</Label>
                    <Select
                      value={formData.case_id}
                      onValueChange={(value) => handleInputChange('case_id', value)}
                    >
                      <SelectTrigger className="bg-background border-input rounded-xl h-11">
                        <SelectValue placeholder="Select a case" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border rounded-xl">
                        {cases?.map((case_item) => (
                          <SelectItem key={case_item.id} value={case_item.id}>
                            {case_item.case_title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hearing_type" className="text-foreground">Hearing Type</Label>
                    <Select
                      value={formData.hearing_type}
                      onValueChange={(value: HearingType) => handleInputChange('hearing_type', value)}
                    >
                      <SelectTrigger className="bg-background border-input rounded-xl h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border rounded-xl">
                        <SelectItem value="preliminary">Preliminary</SelectItem>
                        <SelectItem value="evidence">Evidence</SelectItem>
                        <SelectItem value="arguments">Arguments</SelectItem>
                        <SelectItem value="judgment">Judgment</SelectItem>
                        <SelectItem value="bail">Bail</SelectItem>
                        <SelectItem value="order">Order</SelectItem>
                        <SelectItem value="cross_examination">Cross Examination</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Date & Time Card */}
              <div className="bg-background rounded-2xl shadow-sm p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Hearing Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left bg-background border-input rounded-xl h-11 hover:bg-muted">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.hearing_date ? TimeUtils.formatDisplay(formData.hearing_date, 'PPP') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-background border-border rounded-xl">
                        <Calendar
                          mode="single"
                          selected={typeof formData.hearing_date === 'string' 
                            ? new Date(formData.hearing_date) 
                            : formData.hearing_date}
                          onSelect={(date) => handleInputChange('hearing_date', date || new Date())}
                          initialFocus
                          className="bg-background"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hearing_time" className="text-foreground">Time (Optional)</Label>
                    <Input
                      id="hearing_time"
                      type="time"
                      value={formData.hearing_time || ''}
                      onChange={(e) => handleInputChange('hearing_time', e.target.value)}
                      className="bg-background border-input rounded-xl h-11"
                      placeholder="HH:MM"
                    />
                    <p className="text-xs text-muted-foreground">Leave empty if time is not specified</p>
                  </div>
                </div>
              </div>

              {/* Court Details Card */}
              <div className="bg-background rounded-2xl shadow-sm p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="court_name" className="text-foreground">Court Name *</Label>
                  <Input
                    id="court_name"
                    value={formData.court_name}
                    onChange={(e) => handleInputChange('court_name', e.target.value)}
                    placeholder="Enter court name"
                    className="bg-background border-input rounded-xl h-11"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bench" className="text-foreground">Bench</Label>
                    <Input
                      id="bench"
                      value={formData.bench || ''}
                      onChange={(e) => handleInputChange('bench', e.target.value)}
                      placeholder="Enter bench details"
                      className="bg-background border-input rounded-xl h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coram" className="text-foreground">Coram</Label>
                    <Input
                      id="coram"
                      value={formData.coram || ''}
                      onChange={(e) => handleInputChange('coram', e.target.value)}
                      placeholder="Enter coram details"
                      className="bg-background border-input rounded-xl h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-foreground">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: HearingStatus) => handleInputChange('status', value)}
                  >
                    <SelectTrigger className="bg-background border-input rounded-xl h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border rounded-xl">
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="adjourned">Adjourned</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes Card */}
              <div className="bg-background rounded-2xl shadow-sm p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="outcome" className="text-foreground">Outcome</Label>
                  <Textarea
                    id="outcome"
                    value={formData.outcome || ''}
                    onChange={(e) => handleInputChange('outcome', e.target.value)}
                    placeholder="Enter hearing outcome"
                    rows={3}
                    className="bg-muted border-input rounded-xl resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-foreground">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Enter additional notes"
                    rows={3}
                    className="bg-muted border-input rounded-xl resize-none"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-4 bg-background border-t border-border">
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={closeDialog} className="flex-1 rounded-full h-11">
                Cancel
              </Button>
              <Button 
                type="submit"
                form="hearing-form"
                onClick={handleSubmit}
                className="flex-1 rounded-full h-11"
                disabled={createHearingMutation.isPending}
              >
                {createHearingMutation.isPending ? 'Creating...' : 'Create Hearing'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
