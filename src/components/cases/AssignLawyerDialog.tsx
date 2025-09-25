import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

  const { data: lawyers, isLoading } = useQuery({
    queryKey: ['lawyers'],
    queryFn: async () => {
      // First get team members who are lawyers or admins
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select('id, user_id, role')
        .in('role', ['lawyer', 'admin']);
      
      if (teamError) throw teamError;
      if (!teamMembers || teamMembers.length === 0) return [];

      // Then get their profiles
      const userIds = teamMembers.map(tm => tm.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      if (profileError) throw profileError;

      // Combine the data
      return teamMembers.map(tm => ({
        ...tm,
        profiles: profiles?.find(p => p.id === tm.user_id)
      }));
    }
  });

  const assignLawyersMutation = useMutation({
    mutationFn: async (lawyerIds: string[]) => {
      const { error } = await supabase
        .from('cases')
        .update({ 
          assigned_users: lawyerIds,
          assigned_to: lawyerIds[0] || null // Set primary lawyer as assigned_to
        })
        .eq('id', caseId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Lawyers assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      onClose();
    },
    onError: (error) => {
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Lawyers</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4">Loading lawyers...</div>
          ) : (
            lawyers?.map((lawyer) => (
              <div
                key={lawyer.user_id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => toggleLawyer(lawyer.user_id)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                      {lawyer.profiles?.full_name?.charAt(0) || 'L'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">
                      {lawyer.profiles?.full_name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      {lawyer.role}
                    </p>
                  </div>
                </div>
                {selectedLawyers.includes(lawyer.user_id) && (
                  <Check className="w-5 h-5 text-blue-600" />
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={assignLawyersMutation.isPending}
          >
            {assignLawyersMutation.isPending ? 'Assigning...' : 'Assign Lawyers'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};