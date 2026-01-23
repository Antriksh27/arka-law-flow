import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { X, Calendar, Clock, Scale, FileText } from 'lucide-react';

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
        .from('case_hearings')
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
      <DialogContent className="max-w-full sm:max-w-md h-screen sm:h-auto sm:max-h-[85vh] p-0 bg-slate-50 m-0 sm:m-4 rounded-none sm:rounded-2xl overflow-hidden">
        <div className="flex flex-col h-full sm:h-auto">
          {/* Header */}
          <div className="px-6 py-5 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">Schedule Hearing</h2>
                  <p className="text-sm text-muted-foreground">Add a new hearing date</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="md:hidden w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
            {/* Date & Time Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Date & Time</Label>
                    <p className="text-xs text-muted-foreground">When is the hearing scheduled?</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-500 mb-1.5 block">Date *</Label>
                    <Input
                      type="date"
                      value={formData.hearing_date}
                      onChange={(e) => setFormData({ ...formData, hearing_date: e.target.value })}
                      required
                      className="bg-slate-50 border-slate-200 rounded-xl h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1.5 block">Time</Label>
                    <Input
                      type="time"
                      value={formData.hearing_time}
                      onChange={(e) => setFormData({ ...formData, hearing_time: e.target.value })}
                      className="bg-slate-50 border-slate-200 rounded-xl h-11"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Hearing Type Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-violet-500" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Hearing Type</Label>
                    <p className="text-xs text-muted-foreground">Type of court proceeding</p>
                  </div>
                </div>
                
                <Select 
                  value={formData.hearing_type} 
                  onValueChange={(value) => setFormData({ ...formData, hearing_type: value })}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-11">
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
            </div>

            {/* Court Name Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-sky-500" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Court Name</Label>
                    <p className="text-xs text-muted-foreground">Where is the hearing?</p>
                  </div>
                </div>
                
                <Input
                  value={formData.court_name}
                  onChange={(e) => setFormData({ ...formData, court_name: e.target.value })}
                  placeholder="Enter court name"
                  className="bg-slate-50 border-slate-200 rounded-xl h-11"
                />
              </div>
            </div>

            {/* Notes Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Notes</Label>
                    <p className="text-xs text-muted-foreground">Additional information</p>
                  </div>
                </div>
                
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter any additional notes..."
                  rows={3}
                  className="bg-slate-50 border-slate-200 rounded-xl resize-none"
                />
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 bg-white border-t border-slate-100">
            <div className="flex gap-3 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="rounded-full px-6 border-slate-200"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createHearingMutation.isPending}
                className="rounded-full px-6 bg-amber-500 hover:bg-amber-600"
              >
                {createHearingMutation.isPending ? 'Scheduling...' : 'Schedule Hearing'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
