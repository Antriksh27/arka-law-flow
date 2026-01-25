import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, User, Users, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LawyersTabProps {
  caseId: string;
}

export const LawyersTab: React.FC<LawyersTabProps> = ({ caseId }) => {
  const { toast } = useToast();
  const { firmId } = useAuth();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedLawyers, setSelectedLawyers] = useState<Set<string>>(new Set());

  // Fetch current case data to get assigned lawyers
  const { data: caseData } = useQuery({
    queryKey: ['case-lawyers', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('assigned_users, assigned_to')
        .eq('id', caseId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!caseId
  });

  // Get IDs of all assigned lawyers (assigned_users + assigned_to)
  const assignedLawyerIds = React.useMemo(() => {
    const ids = new Set<string>();
    if (caseData?.assigned_to) ids.add(caseData.assigned_to);
    if (caseData?.assigned_users) {
      caseData.assigned_users.forEach((id: string) => ids.add(id));
    }
    return ids;
  }, [caseData]);

  // Fetch assigned lawyers details from team_members (which has full_name directly)
  const { data: assignedLawyers = [], isLoading: isLoadingAssigned } = useQuery({
    queryKey: ['assigned-lawyers-details', Array.from(assignedLawyerIds)],
    queryFn: async () => {
      if (assignedLawyerIds.size === 0) return [];
      
      // Fetch team members with full_name directly
      const { data: teamData, error: teamError } = await supabase
        .from('team_members')
        .select('id, user_id, role, full_name, email')
        .in('user_id', Array.from(assignedLawyerIds));
      
      if (teamError) throw teamError;
      if (!teamData || teamData.length === 0) return [];

      // Map data to expected format
      return teamData.map(tm => ({
        ...tm,
        profiles: {
          id: tm.user_id,
          full_name: tm.full_name || 'Unknown',
          email: tm.email || 'No email'
        }
      }));
    },
    enabled: assignedLawyerIds.size > 0
  });

  // Fetch all firm lawyers for assignment from team_members
  const { data: availableLawyers = [] } = useQuery({
    queryKey: ['firm-lawyers', firmId],
    queryFn: async () => {
      // Fetch team members with full_name directly
      const { data: teamData, error: teamError } = await supabase
        .from('team_members')
        .select('id, user_id, role, full_name, email')
        .eq('firm_id', firmId)
        .in('role', ['admin', 'lawyer']);
      
      if (teamError) throw teamError;
      if (!teamData || teamData.length === 0) return [];

      // Map data to expected format
      return teamData.map(tm => ({
        ...tm,
        profiles: {
          id: tm.user_id,
          full_name: tm.full_name || 'Unknown',
          email: tm.email || 'No email'
        }
      }));
    },
    enabled: !!firmId
  });

  // Mutation to assign lawyers
  const assignLawyersMutation = useMutation({
    mutationFn: async (lawyerUserIds: string[]) => {
      // Combine new selections with existing ones
      const currentAssigned = new Set(assignedLawyerIds);
      lawyerUserIds.forEach(id => currentAssigned.add(id));
      
      const updatedArray = Array.from(currentAssigned);
      
      const { error } = await supabase
        .from('cases')
        .update({ 
          assigned_users: updatedArray,
          // If there's no assigned_to, set the first lawyer as primary
          ...(caseData?.assigned_to ? {} : { assigned_to: updatedArray[0] })
        })
        .eq('id', caseId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-lawyers', caseId] });
      queryClient.invalidateQueries({ queryKey: ['assigned-lawyers-details'] });
      toast({
        title: 'Success',
        description: 'Lawyers assigned successfully'
      });
      setIsAddDialogOpen(false);
      setSelectedLawyers(new Set());
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign lawyers',
        variant: 'destructive'
      });
    }
  });

  // Mutation to remove lawyer
  const removeLawyerMutation = useMutation({
    mutationFn: async (lawyerUserId: string) => {
      const updatedAssigned = Array.from(assignedLawyerIds).filter(id => id !== lawyerUserId);
      
      const updateData: any = { assigned_users: updatedAssigned };
      
      // If removing the primary assigned lawyer, reassign to another or null
      if (caseData?.assigned_to === lawyerUserId) {
        updateData.assigned_to = updatedAssigned[0] || null;
      }
      
      const { error } = await supabase
        .from('cases')
        .update(updateData)
        .eq('id', caseId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-lawyers', caseId] });
      queryClient.invalidateQueries({ queryKey: ['assigned-lawyers-details'] });
      toast({
        title: 'Success',
        description: 'Lawyer removed successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove lawyer',
        variant: 'destructive'
      });
    }
  });

  const handleAddLawyers = () => {
    if (selectedLawyers.size === 0) {
      toast({
        title: 'No selection',
        description: 'Please select at least one lawyer',
        variant: 'destructive'
      });
      return;
    }
    assignLawyersMutation.mutate(Array.from(selectedLawyers));
  };

  const handleToggleLawyer = (userId: string) => {
    const newSelection = new Set(selectedLawyers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedLawyers(newSelection);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoadingAssigned) {
    return <div className="text-center py-8 text-muted-foreground">Loading lawyers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Assigned Lawyers</h3>
          <p className="text-sm text-muted-foreground">Manage lawyers working on this case</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Lawyer
        </Button>
      </div>

      {assignedLawyers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No lawyers assigned to this case yet.
              <br />
              Click "Add Lawyer" to assign lawyers.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignedLawyers
            .sort((a: any, b: any) => {
              // Admins first
              if (a.role === 'admin' && b.role !== 'admin') return -1;
              if (a.role !== 'admin' && b.role === 'admin') return 1;
              return 0;
            })
            .map((lawyer: any) => {
            const profile = lawyer.profiles;
            const isPrimary = lawyer.user_id === caseData?.assigned_to;
            
            return (
              <Card key={lawyer.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(profile?.full_name || 'Unknown')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground truncate">
                            {profile?.full_name || 'Unknown'}
                          </p>
                          {isPrimary && (
                            <Badge variant="default" className="text-xs">
                              Primary
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {lawyer.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {profile?.email || 'No email'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLawyerMutation.mutate(lawyer.user_id)}
                      disabled={removeLawyerMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Lawyers Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent hideCloseButton className="sm:max-w-2xl p-0 overflow-hidden bg-slate-50">
          <div className="flex flex-col h-full max-h-[85vh] sm:max-h-[90vh] bg-slate-50">
            {/* Drag Handle - mobile only */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>

            {/* iOS-style header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsAddDialogOpen(false)}
                className="text-primary text-base font-medium"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center">
                  <Users className="w-4 h-4 text-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-foreground truncate">Assign Lawyers</p>
                  <p className="text-xs text-muted-foreground truncate sm:hidden">
                    Tap to select
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddLawyers}
                disabled={assignLawyersMutation.isPending || selectedLawyers.size === 0}
                className="text-primary text-base font-semibold disabled:opacity-50"
              >
                {assignLawyersMutation.isPending ? 'Saving...' : 'Done'}
              </button>
            </div>

            {/* Desktop header (kept for accessibility/semantics) */}
            <div className="hidden sm:block px-6 pt-6">
              <DialogHeader>
                <DialogTitle>Assign Lawyers to Case</DialogTitle>
                <DialogDescription>
                  Select one or more lawyers from your firm to assign to this case
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
              {selectedLawyers.size > 0 && (
                <div className="mb-4 p-3 bg-background rounded-xl border border-border">
                  <p className="text-sm text-foreground font-medium text-center">
                    {selectedLawyers.size} selected
                  </p>
                </div>
              )}

              <div className="bg-background rounded-2xl shadow-sm overflow-hidden border border-border">
                <div className="divide-y divide-border">
                  {availableLawyers
                    .filter((lawyer: any) => !assignedLawyerIds.has(lawyer.user_id))
                    .sort((a: any, b: any) => {
                      // Admins first
                      if (a.role === 'admin' && b.role !== 'admin') return -1;
                      if (a.role !== 'admin' && b.role === 'admin') return 1;
                      return 0;
                    })
                    .map((lawyer: any) => {
                      const profile = lawyer.profiles;
                      const isSelected = selectedLawyers.has(lawyer.user_id);

                      return (
                        <div
                          key={lawyer.id}
                          className="flex items-center justify-between p-4 cursor-pointer active:bg-accent transition-colors"
                          onClick={() => handleToggleLawyer(lawyer.user_id)}
                        >
                          <div className="flex items-center gap-3 min-w-0">

                            <Avatar className="h-11 w-11">
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {getInitials(profile?.full_name || 'Unknown')}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm text-foreground truncate">
                                  {profile?.full_name || 'Unknown'}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {lawyer.role}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {profile?.email || 'No email'}
                              </p>
                            </div>
                          </div>

                          <div
                            className={
                              "w-6 h-6 rounded-full flex items-center justify-center transition-all " +
                              (isSelected
                                ? 'bg-primary'
                                : 'border-2 border-border bg-transparent')
                            }
                          >
                            {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {availableLawyers.filter((lawyer: any) => !assignedLawyerIds.has(lawyer.user_id)).length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">
                    All available lawyers are already assigned to this case
                  </div>
                )}
              </div>
            </div>

            {/* Desktop footer actions */}
            <div className="hidden sm:block px-6 pb-6">
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddLawyers}
                  disabled={assignLawyersMutation.isPending || selectedLawyers.size === 0}
                >
                  {assignLawyersMutation.isPending
                    ? 'Assigning...'
                    : `Assign ${selectedLawyers.size > 0 ? `(${selectedLawyers.size})` : ''}`}
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
