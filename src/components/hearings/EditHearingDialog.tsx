import React, { useState, useEffect } from 'react';
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
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import TimeUtils from '@/lib/timeUtils';
import { useDialog } from '@/hooks/use-dialog';
import { useToast } from '@/hooks/use-toast';
import { HearingFormData, HearingType, HearingStatus } from './types';

interface EditHearingDialogProps {
  hearingId: string;
}

export const EditHearingDialog: React.FC<EditHearingDialogProps> = ({ hearingId }) => {
  const { closeDialog } = useDialog();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<HearingFormData>({
    case_id: '',
    hearing_date: TimeUtils.nowDate(),
    hearing_time: '',
    court_name: '',
    bench: '',
    coram: '',
    hearing_type: 'preliminary',
    status: 'scheduled',
    outcome: '',
    notes: '',
  });

  // Fetch hearing data
  const { data: hearing, isLoading } = useQuery({
    queryKey: ['hearing', hearingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_hearings')
        .select('id, case_id, hearing_date, hearing_time, court_name, bench, coram, hearing_type, status, outcome, notes, created_by, created_at, assigned_to, firm_id')
        .eq('id', hearingId)
        .single();
      
      if (error) throw error;
      return data;
    }
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

  // Update form data when hearing data is loaded
  useEffect(() => {
    if (hearing) {
      setFormData({
        case_id: hearing.case_id,
        hearing_date: TimeUtils.toISTDate(hearing.hearing_date) || TimeUtils.nowDate(),
        hearing_time: hearing.hearing_time || '',
        court_name: hearing.court_name,
        bench: hearing.bench || '',
        coram: hearing.coram || '',
        hearing_type: hearing.hearing_type as any,
        status: hearing.status as any,
        outcome: hearing.outcome || '',
        notes: hearing.notes || '',
      });
    }
  }, [hearing]);

  const updateHearingMutation = useMutation({
    mutationFn: async (data: HearingFormData) => {
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
      };

      const { data: result, error } = await supabase
        .from('case_hearings')
        .update(hearingData)
        .eq('id', hearingId)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-hearings'] });
      queryClient.invalidateQueries({ queryKey: ['case-hearings'] });
      queryClient.invalidateQueries({ queryKey: ['hearing', hearingId] });
      toast({
        title: "Success",
        description: "Hearing updated successfully",
      });
      closeDialog();
    },
    onError: (error) => {
      console.error('Error updating hearing:', error);
      toast({
        title: "Error",
        description: "Failed to update hearing",
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
    updateHearingMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof HearingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <Dialog open onOpenChange={closeDialog}>
        <DialogContent className="bg-background border max-w-md">
          <div className="flex items-center justify-center p-8">
            <div className="text-foreground">Loading hearing data...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={closeDialog}>
      <DialogContent hideCloseButton className="sm:max-w-4xl p-0 gap-0 overflow-hidden bg-background">
        <div className="flex flex-col h-full bg-muted">
          {/* Header */}
          <div className="px-6 py-5 bg-background border-b">
            <div className="flex items-center justify-between">
              <DialogHeader className="p-0">
                <DialogTitle className="text-foreground">Edit Hearing</DialogTitle>
              </DialogHeader>
              <button
                onClick={closeDialog}
                className="md:hidden w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {/* Case & Type Card */}
            <div className="bg-background rounded-2xl shadow-sm p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="case" className="text-foreground">Case *</Label>
                  <Select
                    value={formData.case_id}
                    onValueChange={(value) => handleInputChange('case_id', value)}
                  >
                    <SelectTrigger className="bg-muted border-input text-foreground">
                      <SelectValue placeholder="Select a case" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      {cases?.map((case_item) => (
                        <SelectItem key={case_item.id} value={case_item.id} className="text-foreground">
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
                    <SelectTrigger className="bg-muted border-input text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      <SelectItem value="preliminary" className="text-foreground">Preliminary</SelectItem>
                      <SelectItem value="evidence" className="text-foreground">Evidence</SelectItem>
                      <SelectItem value="arguments" className="text-foreground">Arguments</SelectItem>
                      <SelectItem value="judgment" className="text-foreground">Judgment</SelectItem>
                      <SelectItem value="bail" className="text-foreground">Bail</SelectItem>
                      <SelectItem value="order" className="text-foreground">Order</SelectItem>
                      <SelectItem value="cross_examination" className="text-foreground">Cross Examination</SelectItem>
                      <SelectItem value="other" className="text-foreground">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Date & Time Card */}
            <div className="bg-background rounded-2xl shadow-sm p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Hearing Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left bg-muted border-input text-foreground hover:bg-accent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.hearing_date ? TimeUtils.formatDisplay(formData.hearing_date, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background border z-50">
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
                    className="bg-muted border-input text-foreground"
                    placeholder="HH:MM"
                  />
                  <p className="text-xs text-muted-foreground">Leave empty if time is not specified</p>
                </div>
              </div>
            </div>

            {/* Court Info Card */}
            <div className="bg-background rounded-2xl shadow-sm p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="court_name" className="text-foreground">Court Name *</Label>
                <Input
                  id="court_name"
                  value={formData.court_name}
                  onChange={(e) => handleInputChange('court_name', e.target.value)}
                  placeholder="Enter court name"
                  className="bg-muted border-input text-foreground"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bench" className="text-foreground">Bench</Label>
                  <Input
                    id="bench"
                    value={formData.bench || ''}
                    onChange={(e) => handleInputChange('bench', e.target.value)}
                    placeholder="Enter bench details"
                    className="bg-muted border-input text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coram" className="text-foreground">Coram</Label>
                  <Input
                    id="coram"
                    value={formData.coram || ''}
                    onChange={(e) => handleInputChange('coram', e.target.value)}
                    placeholder="Enter coram details"
                    className="bg-muted border-input text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Status & Outcome Card */}
            <div className="bg-background rounded-2xl shadow-sm p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-foreground">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: HearingStatus) => handleInputChange('status', value)}
                >
                  <SelectTrigger className="bg-muted border-input text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="scheduled" className="text-foreground">Scheduled</SelectItem>
                    <SelectItem value="adjourned" className="text-foreground">Adjourned</SelectItem>
                    <SelectItem value="completed" className="text-foreground">Completed</SelectItem>
                    <SelectItem value="cancelled" className="text-foreground">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="outcome" className="text-foreground">Outcome</Label>
                <Textarea
                  id="outcome"
                  value={formData.outcome || ''}
                  onChange={(e) => handleInputChange('outcome', e.target.value)}
                  placeholder="Enter hearing outcome"
                  rows={2}
                  className="bg-muted border-input text-foreground resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-foreground">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Enter additional notes"
                  rows={2}
                  className="bg-muted border-input text-foreground resize-none"
                />
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 bg-background border-t">
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button type="button" variant="outline" onClick={closeDialog} className="rounded-full">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                disabled={updateHearingMutation.isPending}
              >
                {updateHearingMutation.isPending ? 'Updating...' : 'Update Hearing'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
