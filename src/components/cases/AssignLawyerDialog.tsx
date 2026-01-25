import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, X, Users } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface AssignLawyerDialogProps {
  open: boolean;
  onClose: () => void;
  caseId: string;
  currentLawyers?: string[];
}

export const AssignLawyerDialog: React.FC<AssignLawyerDialogProps> = ({
  open,
  onClose,
  caseId,
  currentLawyers = []
}) => {
  const [selectedLawyers, setSelectedLawyers] = useState<string[]>(currentLawyers);
  const queryClient = useQueryClient();

  const { data: lawyers, isLoading } = useQuery({
    queryKey: ['lawyers'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_lawyers_and_juniors');
      
      if (error) throw error;
      
      const transformedData = (data || []).map((row: any) => ({
        id: row.user_id,
        user_id: row.user_id,
        role: row.role,
        full_name: row.full_name || 'Unknown User',
        email: row.email
      }));
      
      return transformedData.sort((a: any, b: any) => {
        if (a.full_name?.includes('Chitrajeet')) return -1;
        if (b.full_name?.includes('Chitrajeet')) return 1;
        return (a.full_name || '').localeCompare(b.full_name || '');
      });
    }
  });

  const assignLawyersMutation = useMutation({
    mutationFn: async (lawyerIds: string[]) => {
      const { error } = await supabase
        .from('cases')
        .update({
          assigned_users: lawyerIds,
          assigned_to: lawyerIds[0] || null
        })
        .eq('id', caseId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Lawyers assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      onClose();
    },
    onError: error => {
      toast.error('Failed to assign lawyers');
      console.error('Error assigning lawyers:', error);
    }
  });

  const toggleLawyer = (lawyerId: string) => {
    setSelectedLawyers(prev => 
      prev.includes(lawyerId) 
        ? prev.filter(id => id !== lawyerId) 
        : [...prev, lawyerId]
    );
  };

  const handleSave = () => {
    assignLawyersMutation.mutate(selectedLawyers);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent hideCloseButton className="sm:max-w-md p-0 bg-slate-50 overflow-hidden">
        <div className="flex flex-col h-full max-h-[85vh] sm:max-h-[90vh]">
          {/* Drag Handle - Mobile Only */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 bg-slate-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50">
            <button
              onClick={onClose}
              className="text-primary text-base font-medium"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-violet-600" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Assign Lawyers</h2>
            </div>
            <button
              onClick={handleSave}
              disabled={assignLawyersMutation.isPending}
              className="text-primary text-base font-semibold disabled:opacity-50"
            >
              {assignLawyersMutation.isPending ? 'Saving...' : 'Done'}
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {/* Selected Count Badge */}
            {selectedLawyers.length > 0 && (
              <div className="mb-4 p-3 bg-violet-50 rounded-xl">
                <p className="text-sm text-violet-700 font-medium text-center">
                  {selectedLawyers.length} lawyer{selectedLawyers.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}

            {/* Lawyers List */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <div className="animate-pulse flex flex-col items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-full" />
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                  </div>
                </div>
              ) : lawyers?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p>No lawyers available</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {lawyers?.map(lawyer => {
                    const isSelected = selectedLawyers.includes(lawyer.user_id);
                    return (
                      <div 
                        key={lawyer.user_id} 
                        className="flex items-center justify-between p-4 active:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => toggleLawyer(lawyer.user_id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-11 h-11 border-2 border-white shadow-sm">
                            <AvatarFallback className={`text-sm font-medium ${
                              isSelected 
                                ? 'bg-violet-500 text-white' 
                                : 'bg-violet-100 text-violet-600'
                            }`}>
                              {lawyer.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {lawyer.full_name}
                            </p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {lawyer.role}
                            </p>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-violet-500' 
                            : 'border-2 border-slate-300'
                        }`}>
                          {isSelected && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
