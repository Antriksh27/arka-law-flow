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
      // First get team members who are lawyers, juniors, or admins
      const {
        data: teamMembers,
        error: teamError
      } = await supabase
        .from('team_members')
        .select('id, user_id, role')
        .in('role', ['lawyer', 'admin', 'junior']);
      
      if (teamError) throw teamError;
      if (!teamMembers || teamMembers.length === 0) return [];

      // Fetch profiles using SECURITY DEFINER RPC to avoid RLS issues
      const { data: roleProfiles, error: rpcError } = await supabase.rpc('get_all_lawyers_and_admin');
      if (rpcError) {
        console.warn('RPC get_all_lawyers_and_admin error:', rpcError);
      }
      const profileMap = new Map(
        (roleProfiles || []).map((p: any) => [p.id, { full_name: p.full_name as string, role: p.role as string }])
      );

      // Combine the data and sort - put Chitrajeet at the top
      return teamMembers
        .map((tm: any) => {
          const prof = profileMap.get(tm.user_id);
          const fullName = prof?.full_name || 'Unknown User';
          return {
            ...tm,
            full_name: fullName,
            role: tm.role,
          };
        })
        .sort((a: any, b: any) => {
          const aTop = a.full_name?.toLowerCase().includes('chitrajeet') ? -1 : 0;
          const bTop = b.full_name?.toLowerCase().includes('chitrajeet') ? -1 : 0;
          if (aTop !== bTop) return aTop - bTop; // ensure Chitrajeet first
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
          <DialogDescription>
            Select lawyers and juniors to assign to this case.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4">Loading lawyers...</div>
          ) : (
            lawyers?.map(lawyer => (
              <div 
                key={lawyer.user_id} 
                className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer" 
                onClick={() => toggleLawyer(lawyer.user_id)}
              >
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
                    <p className="text-sm text-muted-foreground capitalize">
                      {lawyer.role}
                    </p>
                  </div>
                </div>
                {selectedLawyers.includes(lawyer.user_id) && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </div>
            ))
          )}
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