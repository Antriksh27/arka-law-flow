import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, UserMinus, Users, Trash2 } from 'lucide-react';

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
  const { role, firmId, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedLawyerId, setSelectedLawyerId] = useState<string>('');

  // Check if user can edit assigned lawyers
  const canEdit = role === 'admin' || role === 'lawyer' || role === 'office_staff';

  // Fetch assigned lawyers for this client
  const { data: assignedLawyers = [] } = useQuery({
    queryKey: ['client-assigned-lawyers', clientId, firmId],
    queryFn: async () => {
      if (!firmId || !clientId) return [];

      // First get the assignments
      const { data: assignments, error: assignmentError } = await supabase
        .from('client_lawyer_assignments')
        .select('id, lawyer_id, assigned_at')
        .eq('client_id', clientId)
        .eq('firm_id', firmId);
      
      if (assignmentError) throw assignmentError;
      if (!assignments || assignments.length === 0) return [];

      // Then get the team member details for those lawyers
      const lawyerIds = assignments.map(a => a.lawyer_id);
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select('user_id, full_name, role')
        .eq('firm_id', firmId)
        .in('user_id', lawyerIds);
      
      if (teamError) throw teamError;

      // Combine the data
      return assignments.map(assignment => {
        const teamMember = teamMembers?.find(tm => tm.user_id === assignment.lawyer_id);
        return {
          assignmentId: assignment.id,
          lawyerId: assignment.lawyer_id,
          fullName: teamMember?.full_name || 'Unknown',
          role: teamMember?.role || 'unknown',
          assignedAt: assignment.assigned_at
        };
      });
    },
    enabled: open && !!firmId && !!clientId
  });

  // Fetch all available lawyers (not already assigned)
  const { data: availableLawyers = [] } = useQuery({
    queryKey: ['available-lawyers-for-assignment', firmId, clientId],
    queryFn: async () => {
      if (!firmId) return [];

      const { data, error } = await supabase
        .from('team_members')
        .select('user_id, full_name, role')
        .eq('firm_id', firmId)
        .in('role', ['lawyer', 'admin', 'junior']);
      
      if (error) throw error;
      
      // Filter out already assigned lawyers
      const assignedLawyerIds = assignedLawyers.map(al => al.lawyerId);
      const available = data?.filter(lawyer => !assignedLawyerIds.includes(lawyer.user_id)) || [];
      
      // Sort to always show "chitrajeet upadhyaya" first
      return available.sort((a, b) => {
        const nameA = (a.full_name || '').toLowerCase();
        const nameB = (b.full_name || '').toLowerCase();
        
        if (nameA.includes('chitrajeet upadhyaya')) return -1;
        if (nameB.includes('chitrajeet upadhyaya')) return 1;
        return nameA.localeCompare(nameB);
      });
    },
    enabled: open && !!firmId,
    // Re-run when assigned lawyers change
    select: (data) => {
      const assignedLawyerIds = assignedLawyers.map(al => al.lawyerId);
      const available = data?.filter(lawyer => !assignedLawyerIds.includes(lawyer.user_id)) || [];
      
      return available.sort((a, b) => {
        const nameA = (a.full_name || '').toLowerCase();
        const nameB = (b.full_name || '').toLowerCase();
        
        if (nameA.includes('chitrajeet upadhyaya')) return -1;
        if (nameB.includes('chitrajeet upadhyaya')) return 1;
        return nameA.localeCompare(nameB);
      });
    }
  });


  // Add lawyer mutation
  const addLawyerMutation = useMutation({
    mutationFn: async (lawyerId: string) => {
      if (!firmId) throw new Error('Firm ID is required');
      
      const { error } = await supabase
        .from('client_lawyer_assignments')
        .insert({
          client_id: clientId,
          lawyer_id: lawyerId,
          firm_id: firmId,
          assigned_by: user?.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Lawyer added successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['client-assigned-lawyers', clientId, firmId] });
      queryClient.invalidateQueries({ queryKey: ['available-lawyers-for-assignment', firmId, clientId] });
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      setSelectedLawyerId('');
    },
    onError: (error) => {
      console.error('Error adding lawyer:', error);
      toast({
        title: "Error",
        description: "Failed to add lawyer",
        variant: "destructive"
      });
    }
  });

  // Remove lawyer mutation
  const removeLawyerMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('client_lawyer_assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Lawyer removed successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['client-assigned-lawyers', clientId, firmId] });
      queryClient.invalidateQueries({ queryKey: ['available-lawyers-for-assignment', firmId, clientId] });
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

  const handleAddLawyer = () => {
    if (!selectedLawyerId) {
      toast({
        title: "Error",
        description: "Please select a lawyer to add",
        variant: "destructive"
      });
      return;
    }
    console.log('Assign dialog: adding lawyer', { selectedLawyerId, clientId });
    addLawyerMutation.mutate(selectedLawyerId);
  };

  const handleRemoveLawyer = (assignmentId: string) => {
    removeLawyerMutation.mutate(assignmentId);
  };

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
          {/* Currently Assigned Lawyers */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">
              Assigned Lawyers ({assignedLawyers.length})
            </h4>
            {assignedLawyers.length > 0 ? (
              <div className="space-y-2">
                {assignedLawyers.map((assignment) => (
                  <div key={assignment.assignmentId} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-blue-100 text-blue-800">
                        {assignment.role}
                      </Badge>
                      <span className="font-medium">{assignment.fullName}</span>
                      <span className="text-xs text-gray-500">
                        Added {new Date(assignment.assignedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveLawyer(assignment.assignmentId)}
                        disabled={removeLawyerMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                No lawyers currently assigned
              </div>
            )}
          </div>

          {/* Add New Lawyer */}
          {canEdit && availableLawyers.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">
                Add Lawyer
              </h4>
              <div className="flex gap-2">
                <Select value={selectedLawyerId} onValueChange={(v) => { 
                  console.log('Assign dialog: selectedLawyerId ->', v);
                  setSelectedLawyerId(v);
                }}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a lawyer to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLawyers.map((lawyer) => (
                      <SelectItem key={lawyer.user_id} value={lawyer.user_id}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {lawyer.role}
                          </Badge>
                          {lawyer.full_name || 'Unnamed'}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={handleAddLawyer}
                  disabled={!selectedLawyerId || addLawyerMutation.isPending}
                  className="shrink-0"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Add
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
          {canEdit && availableLawyers.length === 0 && assignedLawyers.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                All available lawyers in your firm are currently assigned to this client.
              </p>
            </div>
          )}

          {/* No Lawyers in Firm */}
          {canEdit && availableLawyers.length === 0 && assignedLawyers.length === 0 && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-800">
                No lawyers available in your firm to assign to this client.
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