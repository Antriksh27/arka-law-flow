import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface CreateHearingDialogWrapperProps {
  open: boolean;
  onClose: () => void;
  caseId: string;
}

export const CreateHearingDialogWrapper: React.FC<CreateHearingDialogWrapperProps> = ({
  open,
  onClose,
  caseId
}) => {
  const [formData, setFormData] = useState({
    hearing_date: '',
    hearing_time: '12:00',
    hearing_type: 'initial_hearing',
    court_name: '',
    notes: '',
    status: 'scheduled'
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createHearingMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('hearings')
        .insert({
          ...data,
          case_id: caseId,
          created_by: user?.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-hearings', caseId] });
      toast({
        title: "Success",
        description: "Hearing scheduled successfully"
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Error creating hearing:', error);
      toast({
        title: "Error",
        description: "Failed to schedule hearing",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createHearingMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData({
      hearing_date: '',
      hearing_time: '12:00',
      hearing_type: 'initial_hearing',
      court_name: '',
      notes: '',
      status: 'scheduled'
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule New Hearing</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="hearing_date">Hearing Date *</Label>
            <Input
              id="hearing_date"
              type="date"
              value={formData.hearing_date}
              onChange={(e) => setFormData({ ...formData, hearing_date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="hearing_time">Hearing Time</Label>
            <Input
              id="hearing_time"
              type="time"
              value={formData.hearing_time}
              onChange={(e) => setFormData({ ...formData, hearing_time: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="hearing_type">Hearing Type</Label>
            <Select 
              value={formData.hearing_type} 
              onValueChange={(value) => setFormData({ ...formData, hearing_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="initial_hearing">Initial Hearing</SelectItem>
                <SelectItem value="interim_hearing">Interim Hearing</SelectItem>
                <SelectItem value="final_hearing">Final Hearing</SelectItem>
                <SelectItem value="arguments">Arguments</SelectItem>
                <SelectItem value="judgment">Judgment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="court_name">Court Name</Label>
            <Input
              id="court_name"
              value={formData.court_name}
              onChange={(e) => setFormData({ ...formData, court_name: e.target.value })}
              placeholder="Enter court name"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter any additional notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createHearingMutation.isPending}
              className="bg-slate-800 hover:bg-slate-700"
            >
              {createHearingMutation.isPending ? 'Scheduling...' : 'Schedule Hearing'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};