import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, UserMinus, Users } from 'lucide-react';

interface ManageAssignedLawyersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

export const ManageAssignedLawyersDialog: React.FC<ManageAssignedLawyersDialogProps> = ({
  open,
  onOpenChange,
  clientId,
  clientName
}) => {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [selectedLawyerId, setSelectedLawyerId] = useState<string>('');

  // Check if user can edit assigned lawyers
  const canEdit = role === 'admin' || role === 'lawyer' || role === 'office_staff';

  // Fetch current client data
  const { data: client } = useQuery({
    queryKey: ['client-assigned-lawyers', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('assigned_lawyer_id')
        .eq('id', clientId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Fetch all lawyers
  const { data: lawyers = [] } = useQuery({
    queryKey: ['lawyers-for-assignment'],
    queryFn: async () => {
      // First get user IDs from team_members with the right roles
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select('user_id')
        .in('role', ['lawyer', 'admin', 'junior']);
      
      if (teamError) throw teamError;
      
      if (!teamMembers || teamMembers.length === 0) return [];
      
      const userIds = teamMembers.map(member => member.user_id);
      
      // Then get profile details for those users
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      
      if (profileError) throw profileError;
      
      // Sort to always show "chitrajeet upadhyaya" first
      return profiles?.sort((a, b) => {
        const nameA = a.full_name?.toLowerCase() || '';
        const nameB = b.full_name?.toLowerCase() || '';
        
        if (nameA.includes('chitrajeet upadhyaya')) return -1;
        if (nameB.includes('chitrajeet upadhyaya')) return 1;
        return nameA.localeCompare(nameB);
      }) || [];
    },
    enabled: open
  });

  // Get assigned lawyer details
  const { data: assignedLawyer } = useQuery({
    queryKey: ['assigned-lawyer-details', client?.assigned_lawyer_id],
    queryFn: async () => {
      if (!client?.assigned_lawyer_id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', client.assigned_lawyer_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: open && !!client?.assigned_lawyer_id
  });

  // Assign lawyer mutation
  const assignLawyerMutation = useMutation({
    mutationFn: async (lawyerId: string) => {
      const { error } = await supabase
        .from('clients')
        .update({ assigned_lawyer_id: lawyerId })
        .eq('id', clientId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Lawyer assigned successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['client-assigned-lawyers', clientId] });
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      setSelectedLawyerId('');
    },
    onError: (error) => {
      console.error('Error assigning lawyer:', error);
      toast({
        title: "Error",
        description: "Failed to assign lawyer",
        variant: "destructive"
      });
    }
  });

  // Remove lawyer mutation
  const removeLawyerMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('clients')
        .update({ assigned_lawyer_id: null })
        .eq('id', clientId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Lawyer removed successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['client-assigned-lawyers', clientId] });
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
    },
    onError: (error) => {
      console.error('Error removing lawyer:', error);
      toast({
        title: "Error",
        description: "Failed to remove lawyer",
        variant: "destructive"
      });
    }
  });

  const handleAssignLawyer = () => {
    if (!selectedLawyerId) {
      toast({
        title: "Error",
        description: "Please select a lawyer to assign",
        variant: "destructive"
      });
      return;
    }
    assignLawyerMutation.mutate(selectedLawyerId);
  };

  const handleRemoveLawyer = () => {
    removeLawyerMutation.mutate();
  };

  // Available lawyers (exclude already assigned lawyer)
  const availableLawyers = lawyers.filter(lawyer => 
    lawyer.id !== client?.assigned_lawyer_id
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Manage Assigned Lawyers
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Client: {clientName}
          </p>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Current Assigned Lawyer */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Currently Assigned</h4>
            {assignedLawyer ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    Assigned
                  </Badge>
                  <span className="font-medium">{assignedLawyer.full_name}</span>
                </div>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRemoveLawyer}
                    disabled={removeLawyerMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <UserMinus className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                No lawyer currently assigned
              </div>
            )}
          </div>

          {/* Assign New Lawyer */}
          {canEdit && availableLawyers.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">
                {assignedLawyer ? 'Change Assignment' : 'Assign Lawyer'}
              </h4>
              <div className="flex gap-2">
                <Select value={selectedLawyerId} onValueChange={setSelectedLawyerId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a lawyer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLawyers.map((lawyer) => (
                      <SelectItem key={lawyer.id} value={lawyer.id}>
                        {lawyer.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAssignLawyer}
                  disabled={!selectedLawyerId || assignLawyerMutation.isPending}
                  className="shrink-0"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  {assignedLawyer ? 'Change' : 'Assign'}
                </Button>
              </div>
            </div>
          )}

          {/* No Permission Message */}
          {!canEdit && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                You don't have permission to manage assigned lawyers. Only administrators, lawyers, and office staff can make changes.
              </p>
            </div>
          )}

          {/* No Available Lawyers */}
          {canEdit && availableLawyers.length === 0 && assignedLawyer && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                All available lawyers are currently assigned or there are no other lawyers to assign.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};