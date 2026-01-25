import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCaseGroupChat } from '@/hooks/useCaseGroupChat';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, UserPlus, Loader2, Users, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ManageParticipantsDialogProps {
  open: boolean;
  onClose: () => void;
  caseId: string;
  groupGuid: string;
}

const AVATAR_COLORS = [
  { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  { bg: 'bg-sky-100', text: 'text-sky-600' },
  { bg: 'bg-violet-100', text: 'text-violet-600' },
  { bg: 'bg-amber-100', text: 'text-amber-600' },
  { bg: 'bg-rose-100', text: 'text-rose-600' },
];

const getAvatarColor = (name: string) => {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

export const ManageParticipantsDialog: React.FC<ManageParticipantsDialogProps> = ({
  open,
  onClose,
  caseId,
  groupGuid
}) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
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

  const caseName = caseData?.case_title || `${caseData?.petitioner || ''} vs ${caseData?.respondent || ''}`;
  
  const { members, refreshMembers, addMember, removeMember } = useCaseGroupChat({
    caseId,
    caseName,
    firmId: caseData?.firm_id || ''
  });

  // Fetch team members from the same firm
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members', caseData?.firm_id],
    queryFn: async () => {
      if (!caseData?.firm_id) return [];
      const { data, error } = await supabase
        .from('team_members')
        .select('id, user_id, full_name, email, role')
        .eq('firm_id', caseData.firm_id)
        .not('user_id', 'is', null);
      if (error) {
        console.error('Error fetching team members:', error);
        return [];
      }
      return data || [];
    },
    enabled: open && !!caseData?.firm_id
  });

  // Filter out users who are already in the group
  const memberUserIds = members.map(m => m.getUid());
  const availableTeamMembers = teamMembers.filter(tm => tm.user_id && !memberUserIds.includes(tm.user_id));

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
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "p-0 gap-0 overflow-hidden",
          isMobile ? "bg-slate-50" : "sm:max-w-[480px] bg-slate-50"
        )}
        hideCloseButton
      >
        {/* iOS-style Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 -ml-2"
          >
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-sky-600" />
            </div>
            <span className="font-semibold text-slate-900">Participants</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-sky-500 hover:text-sky-600 font-semibold -mr-2"
          >
            Done
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Add Participant Section */}
          {availableTeamMembers.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Add Team Member
                </p>
              </div>
              <div className="p-3">
                <div className="flex gap-2">
                  <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={isAdding}>
                    <SelectTrigger className="flex-1 h-11 bg-slate-50 border-0 rounded-xl text-sm">
                      <SelectValue placeholder="Select a team member..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeamMembers.map(member => {
                        const colors = getAvatarColor(member.full_name || member.email);
                        return (
                          <SelectItem key={member.user_id} value={member.user_id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className={cn("text-[10px] font-medium", colors.bg, colors.text)}>
                                  {getInitials(member.full_name || member.email)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{member.full_name || member.email}</span>
                              <Badge className="ml-auto text-[10px] bg-slate-100 text-slate-600 border-0">
                                {member.role}
                              </Badge>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleAddMember} 
                    disabled={!selectedUserId || isAdding} 
                    size="icon"
                    className="h-11 w-11 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200"
                  >
                    {isAdding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {availableTeamMembers.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">All members added</p>
                  <p className="text-xs text-slate-500">Everyone on your team is in this chat</p>
                </div>
              </div>
            </div>
          )}

          {/* Current Participants Section */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Current Participants ({members.length})
              </p>
            </div>
            <ScrollArea className={isMobile ? "h-[calc(100vh-350px)]" : "h-[280px]"}>
              <div className="divide-y divide-slate-100">
                {members.map(member => {
                  const isCurrentUser = member.getUid() === user?.id;
                  const memberName = member.getName() || 'Unknown User';
                  const colors = getAvatarColor(memberName);
                  
                  return (
                    <div 
                      key={member.getUid()} 
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={cn("text-sm font-medium", colors.bg, colors.text)}>
                            {getInitials(memberName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900">
                            {memberName}
                          </span>
                          {isCurrentUser && (
                            <span className="text-xs text-slate-500">You</span>
                          )}
                        </div>
                      </div>
                      {!isCurrentUser && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600"
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
