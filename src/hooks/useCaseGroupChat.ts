import { useEffect, useState, useCallback } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChat } from './useCometChat';
import {
  getOrCreateCaseGroup,
  getCaseGroupMembers,
  addMembersToCaseGroup,
  removeMemberFromCaseGroup,
  ensureUserIsMember
} from '@/lib/cometchat-groups';
import { supabase } from '@/integrations/supabase/client';

interface UseCaseGroupChatOptions {
  caseId: string;
  caseName: string;
  firmId: string;
}

export const useCaseGroupChat = ({ caseId, caseName, firmId }: UseCaseGroupChatOptions) => {
  const { isCometChatReady, cometChatUser } = useCometChat();
  const [group, setGroup] = useState<CometChat.Group | null>(null);
  const [members, setMembers] = useState<CometChat.GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if current user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!cometChatUser || !firmId) return;
      
      const { data } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', cometChatUser.getUid())
        .eq('firm_id', firmId)
        .single();
      
      setIsAdmin(data?.role === 'admin');
    };
    checkAdmin();
  }, [cometChatUser, firmId]);

  // Initialize group with admin-aware logic
  const initializeGroup = useCallback(async () => {
    if (!isCometChatReady || !cometChatUser || !firmId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check current user's role
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', cometChatUser.getUid())
        .eq('firm_id', firmId)
        .single();
      
      const userIsAdmin = teamMember?.role === 'admin';
      
      // Try to get or create group
      const caseGroup = await getOrCreateCaseGroup(
        caseId,
        caseName,
        firmId,
        cometChatUser.getUid(),
        cometChatUser.getName(),
        userIsAdmin
      );

      // Fetch all team members assigned to this case
      const { data: caseAssignments } = await supabase
        .from('case_assignments')
        .select(`
          team_member_id,
          team_members:team_member_id (
            user_id,
            full_name
          )
        `)
        .eq('case_id', caseId);

      // Get current group members
      const groupMembers = await getCaseGroupMembers(caseId);
      const memberUids = new Set(groupMembers.map(m => m.getUid()));

      // Auto-add all assigned team members to the chat
      if (caseAssignments && caseAssignments.length > 0) {
        const membersToAdd: { userId: string; userName: string }[] = [];
        
        for (const assignment of caseAssignments) {
          const teamMemberData = assignment.team_members as any;
          if (teamMemberData?.user_id && !memberUids.has(teamMemberData.user_id)) {
            membersToAdd.push({
              userId: teamMemberData.user_id,
              userName: teamMemberData.full_name || 'Team Member'
            });
          }
        }

        // Add all missing assigned members
        if (membersToAdd.length > 0) {
          const memberNames: Record<string, string> = {};
          membersToAdd.forEach(m => {
            memberNames[m.userId] = m.userName;
          });
          
          try {
            await addMembersToCaseGroup(
              caseId,
              membersToAdd.map(m => m.userId),
              memberNames
            );
          } catch (addErr) {
            console.error('Error auto-adding assigned members:', addErr);
          }
        }
      }

      // Check if current user is a member (refresh after potential additions)
      const updatedGroupMembers = await getCaseGroupMembers(caseId);
      const isMember = updatedGroupMembers.some(m => m.getUid() === cometChatUser.getUid());
      
      if (!isMember) {
        // Check if current user is assigned to the case
        const isAssigned = caseAssignments?.some(
          a => (a.team_members as any)?.user_id === cometChatUser.getUid()
        );

        if (userIsAdmin || isAssigned) {
          // Admin or assigned user can add themselves
          await ensureUserIsMember(
            caseId,
            cometChatUser.getUid(),
            cometChatUser.getName()
          );
        } else {
          setError(new Error('You are not a participant in this chat. Ask an admin to add you.'));
          setIsLoading(false);
          return;
        }
      }

      setGroup(caseGroup);

      // Fetch members
      const finalMembers = await getCaseGroupMembers(caseId);
      setMembers(finalMembers);
    } catch (err) {
      console.error('Error initializing case group:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize group'));
    } finally {
      setIsLoading(false);
    }
  }, [isCometChatReady, cometChatUser, caseId, caseName, firmId]);

  // Refresh members list
  const refreshMembers = useCallback(async () => {
    try {
      const groupMembers = await getCaseGroupMembers(caseId);
      setMembers(groupMembers);
    } catch (err) {
      console.error('Error refreshing members:', err);
    }
  }, [caseId]);

  // Add a member to the group
  const addMember = useCallback(async (memberId: string, memberName: string) => {
    try {
      await addMembersToCaseGroup(caseId, [memberId], { [memberId]: memberName });
      await refreshMembers();
    } catch (err) {
      console.error('Error adding member:', err);
      throw err;
    }
  }, [caseId, refreshMembers]);

  // Remove a member from the group
  const removeMember = useCallback(async (memberId: string) => {
    try {
      await removeMemberFromCaseGroup(caseId, memberId);
      await refreshMembers();
    } catch (err) {
      console.error('Error removing member:', err);
      throw err;
    }
  }, [caseId, refreshMembers]);

  // Initialize on mount
  useEffect(() => {
    initializeGroup();
  }, [initializeGroup]);

  // Listen for group member changes
  useEffect(() => {
    if (!group) return;

    const listenerID = `case_group_${caseId}`;

    CometChat.addGroupListener(
      listenerID,
      new CometChat.GroupListener({
        onGroupMemberJoined: (message: CometChat.Action) => {
          console.log('Member joined:', message);
          refreshMembers();
        },
        onGroupMemberLeft: (message: CometChat.Action) => {
          console.log('Member left:', message);
          refreshMembers();
        },
        onGroupMemberKicked: (message: CometChat.Action) => {
          console.log('Member kicked:', message);
          refreshMembers();
        },
        onGroupMemberBanned: (message: CometChat.Action) => {
          console.log('Member banned:', message);
          refreshMembers();
        },
        onMemberAddedToGroup: (message: CometChat.Action) => {
          console.log('Member added:', message);
          refreshMembers();
        }
      })
    );

    return () => {
      CometChat.removeGroupListener(listenerID);
    };
  }, [group, caseId, refreshMembers]);

  return {
    group,
    members,
    isLoading,
    error,
    isAdmin,
    addMember,
    removeMember,
    refreshMembers,
    isReady: isCometChatReady && !!group
  };
};
