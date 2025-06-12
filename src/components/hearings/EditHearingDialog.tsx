
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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
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
    hearing_date: new Date(),
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
        .from('hearings')
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
        hearing_date: new Date(hearing.hearing_date),
        hearing_time: hearing.hearing_time || '',
        court_name: hearing.court_name,
        bench: hearing.bench || '',
        coram: hearing.coram || '',
        hearing_type: hearing.hearing_type,
        status: hearing.status,
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
          : format(data.hearing_date, 'yyyy-MM-dd'),
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
        .from('hearings')
        .update(hearingData)
        .eq('id', hearingId)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hearings'] });
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
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <div>Loading hearing data...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={closeDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Hearing</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="case">Case *</Label>
              <Select
                value={formData.case_id}
                onValueChange={(value) => handleInputChange('case_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a case" />
                </SelectTrigger>
                <SelectContent>
                  {cases?.map((case_item) => (
                    <SelectItem key={case_item.id} value={case_item.id}>
                      {case_item.case_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hearing_type">Hearing Type</Label>
              <Select
                value={formData.hearing_type}
                onValueChange={(value: HearingType) => handleInputChange('hearing_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preliminary">Preliminary</SelectItem>
                  <SelectItem value="evidence">Evidence</SelectItem>
                  <SelectItem value="arguments">Arguments</SelectItem>
                  <SelectItem value="judgment">Judgment</SelectItem>
                  <SelectItem value="bail">Bail</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="cross_examination">Cross Examination</SelectItem>
                  <SelectItem value="first_hearing">First Hearing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hearing Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.hearing_date ? format(
                      typeof formData.hearing_date === 'string' 
                        ? new Date(formData.hearing_date) 
                        : formData.hearing_date, 
                      'PPP'
                    ) : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={typeof formData.hearing_date === 'string' 
                      ? new Date(formData.hearing_date) 
                      : formData.hearing_date}
                    onSelect={(date) => handleInputChange('hearing_date', date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hearing_time">Time</Label>
              <Input
                id="hearing_time"
                type="time"
                value={formData.hearing_time || ''}
                onChange={(e) => handleInputChange('hearing_time', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="court_name">Court Name *</Label>
            <Input
              id="court_name"
              value={formData.court_name}
              onChange={(e) => handleInputChange('court_name', e.target.value)}
              placeholder="Enter court name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bench">Bench</Label>
              <Input
                id="bench"
                value={formData.bench || ''}
                onChange={(e) => handleInputChange('bench', e.target.value)}
                placeholder="Enter bench details"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coram">Coram</Label>
              <Input
                id="coram"
                value={formData.coram || ''}
                onChange={(e) => handleInputChange('coram', e.target.value)}
                placeholder="Enter coram details"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: HearingStatus) => handleInputChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="adjourned">Adjourned</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="outcome">Outcome</Label>
            <Textarea
              id="outcome"
              value={formData.outcome || ''}
              onChange={(e) => handleInputChange('outcome', e.target.value)}
              placeholder="Enter hearing outcome"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter additional notes"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-700 hover:bg-blue-800"
              disabled={updateHearingMutation.isPending}
            >
              {updateHearingMutation.isPending ? 'Updating...' : 'Update Hearing'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
