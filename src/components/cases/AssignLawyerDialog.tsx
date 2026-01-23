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
      <DialogContent className="max-w-full sm:max-w-md h-screen sm:h-auto sm:max-h-[80vh] p-0 bg-slate-50 m-0 sm:m-4 rounded-none sm:rounded-2xl overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-5 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">Assign Lawyers</h2>
                  <p className="text-sm text-muted-foreground">Select team members for this case</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="md:hidden w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading lawyers...
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {lawyers?.map(lawyer => (
                    <div 
                      key={lawyer.user_id} 
                      className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer transition-colors active:scale-[0.99]"
                      onClick={() => toggleLawyer(lawyer.user_id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-violet-100 text-violet-600 text-sm font-medium">
                            {lawyer.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-800">
                            {lawyer.full_name}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {lawyer.role}
                          </p>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        selectedLawyers.includes(lawyer.user_id) 
                          ? 'bg-violet-500' 
                          : 'bg-slate-100'
                      }`}>
                        {selectedLawyers.includes(lawyer.user_id) && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedLawyers.length > 0 && (
              <div className="mt-4 p-3 bg-violet-50 rounded-xl">
                <p className="text-sm text-violet-700 font-medium">
                  {selectedLawyers.length} lawyer{selectedLawyers.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-white border-t border-slate-100">
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-full px-6 border-slate-200"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={assignLawyersMutation.isPending}
                className="rounded-full px-6 bg-violet-500 hover:bg-violet-600"
              >
                {assignLawyersMutation.isPending ? 'Assigning...' : 'Assign Lawyers'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
