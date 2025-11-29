import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCaseGroupChat } from '@/hooks/useCaseGroupChat';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ManageParticipantsDialogProps {
  open: boolean;
  onClose: () => void;
  caseId: string;
  groupGuid: string;
}

export const ManageParticipantsDialog: React.FC<ManageParticipantsDialogProps> = ({
  open,
  onClose,
  caseId,
  groupGuid
}) => {
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);

  // Get case data for name
  const { data: caseData } = useQuery({
    queryKey: ['case-for-chat', caseId],
    queryFn: async () => {
      const { data } = await supabase
        .from('cases')
        .select('petitioner, respondent, case_title, firm_id')
        .eq('id', caseId)
        .single();
      return data;
    },
    enabled: open
  });

  const caseName = caseData?.case_title || 
    `${caseData?.petitioner || ''} vs ${caseData?.respondent || ''}`;

  const { members, refreshMembers, addMember, removeMember } = useCaseGroupChat({
    caseId,
    caseName
  });

  // Fetch team members from the same firm
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members', caseData?.firm_id],
    queryFn: async () => {
      if (!caseData?.firm_id) return [];
      
      const { data } = await supabase
        .from('team_members')
        .select(`
          id,
          user_id,
          full_name,
          email,
          role,
          profiles!inner(id)
        `)
        .eq('firm_id', caseData.firm_id);
      
      return data || [];
    },
    enabled: open && !!caseData?.firm_id
  });

  // Filter out users who are already in the group
  const memberUserIds = members.map(m => m.getUid());
  const availableTeamMembers = teamMembers.filter(
    tm => !memberUserIds.includes(tm.user_id)
  );

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    const selectedMember = teamMembers.find(tm => tm.user_id === selectedUserId);
    if (!selectedMember) return;

    setIsAdding(true);
    try {
      await addMember(selectedUserId, selectedMember.full_name || selectedMember.email);
      toast.success(`Added ${selectedMember.full_name || selectedMember.email} to the chat`);
      setSelectedUserId('');
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member to chat');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (memberId === user?.id) {
      toast.error('You cannot remove yourself from the chat');
      return;
    }

    try {
      await removeMember(memberId);
      toast.success(`Removed ${memberName} from the chat`);
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member from chat');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Chat Participants</DialogTitle>
          <DialogDescription>
            Add or remove team members from this case chat
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Participants */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">
              Current Participants ({members.length})
            </h4>
            <ScrollArea className="h-[200px] rounded-lg border border-border">
              <div className="space-y-2 p-2">
                {members.map((member) => {
                  const isCurrentUser = member.getUid() === user?.id;
                  const memberName = member.getName() || 'Unknown User';
                  
                  return (
                    <div
                      key={member.getUid()}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(memberName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {memberName}
                          </span>
                          {isCurrentUser && (
                            <Badge variant="outline" className="w-fit text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                      </div>
                      {!isCurrentUser && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveMember(member.getUid(), memberName)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Add Participant */}
          {availableTeamMembers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 text-foreground">
                Add Team Member
              </h4>
              <div className="flex gap-2">
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  disabled={isAdding}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeamMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(member.full_name || member.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.full_name || member.email}</span>
                          <Badge variant="outline" className="ml-auto text-xs">
                            {member.role}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddMember}
                  disabled={!selectedUserId || isAdding}
                  size="icon"
                >
                  {isAdding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {availableTeamMembers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              All team members have been added to the chat
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
