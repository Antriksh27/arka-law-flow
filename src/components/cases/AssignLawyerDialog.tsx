import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
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
  const {
    data: lawyers,
    isLoading
  } = useQuery({
    queryKey: ['lawyers'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_team_members_with_names', {
        p_roles: ['lawyer', 'admin', 'junior']
      });
      if (error) throw error;
      const list = (data || []).map((row: any) => ({
        id: row.user_id,
        user_id: row.user_id,
        role: row.role,
        full_name: row.full_name,
        email: row.email
      }));
      return list.sort((a: any, b: any) => {
        if (a.full_name?.includes('Chitrajeet')) return -1;
        if (b.full_name?.includes('Chitrajeet')) return 1;
        return (a.full_name || '').localeCompare(b.full_name || '');
      });
    }
  });
  const assignLawyersMutation = useMutation({
    mutationFn: async (lawyerIds: string[]) => {
      const {
        error
      } = await supabase.from('cases').update({
        assigned_users: lawyerIds,
        assigned_to: lawyerIds[0] || null // Set primary lawyer as assigned_to
      }).eq('id', caseId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Lawyers assigned successfully');
      queryClient.invalidateQueries({
        queryKey: ['case', caseId]
      });
      onClose();
    },
    onError: error => {
      toast.error('Failed to assign lawyers');
      console.error('Error assigning lawyers:', error);
    }
  });
  const toggleLawyer = (lawyerId: string) => {
    setSelectedLawyers(prev => prev.includes(lawyerId) ? prev.filter(id => id !== lawyerId) : [...prev, lawyerId]);
  };
  const handleSave = () => {
    assignLawyersMutation.mutate(selectedLawyers);
  };
  return <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Lawyers</DialogTitle>
          <DialogDescription>Select lawyers and juniors to assign to this case.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {isLoading ? <div className="text-center py-4">Loading lawyers...</div> : lawyers?.map(lawyer => <div key={lawyer.user_id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer" onClick={() => toggleLawyer(lawyer.user_id)}>
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {lawyer.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {lawyer.full_name}
                    </p>
                    
                  </div>
                </div>
                {selectedLawyers.includes(lawyer.user_id) && <Check className="w-5 h-5 text-primary" />}
              </div>)}
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={assignLawyersMutation.isPending}>
            {assignLawyersMutation.isPending ? 'Assigning...' : 'Assign Lawyers'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
};