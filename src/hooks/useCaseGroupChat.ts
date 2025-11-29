import { useEffect, useState, useCallback } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChat } from './useCometChat';
import {
  getOrCreateCaseGroup,
  getCaseGroupMembers,
  addMembersToCaseGroup,
  removeMemberFromCaseGroup,
  joinCaseGroup
} from '@/lib/cometchat-groups';

interface UseCaseGroupChatOptions {
  caseId: string;
  caseName: string;
}

export const useCaseGroupChat = ({ caseId, caseName }: UseCaseGroupChatOptions) => {
  const { isCometChatReady, cometChatUser } = useCometChat();
  const [group, setGroup] = useState<CometChat.Group | null>(null);
  const [members, setMembers] = useState<CometChat.GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize group and join it
  const initializeGroup = useCallback(async () => {
    if (!isCometChatReady || !cometChatUser) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get or create the group
      const caseGroup = await getOrCreateCaseGroup(
        caseId,
        caseName,
        cometChatUser.getUid()
      );

      // Try to join the group if we're not already a member
      try {
        await joinCaseGroup(caseId);
      } catch (joinError: any) {
        // If already a member, that's fine
        if (joinError?.code !== 'ERR_ALREADY_JOINED') {
          console.warn('Error joining group:', joinError);
        }
      }

      setGroup(caseGroup);

      // Fetch members
      const groupMembers = await getCaseGroupMembers(caseId);
      setMembers(groupMembers);
    } catch (err) {
      console.error('Error initializing case group:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize group'));
    } finally {
      setIsLoading(false);
    }
  }, [isCometChatReady, cometChatUser, caseId, caseName]);

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
    addMember,
    removeMember,
    refreshMembers,
    isReady: isCometChatReady && !!group
  };
};
