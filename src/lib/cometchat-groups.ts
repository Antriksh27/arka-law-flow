import { CometChat } from '@cometchat/chat-sdk-javascript';
import { loginCometChatUser, createCometChatUser } from './cometchat';
import { supabase } from '@/integrations/supabase/client';

/**
 * Get the admin user for a firm
 */
export const getFirmAdmin = async (firmId: string) => {
  const { data } = await supabase
    .from('team_members')
    .select('user_id, full_name')
    .eq('firm_id', firmId)
    .eq('role', 'admin')
    .single();
  return data;
};

/**
 * Get or create a CometChat group for a case
 * If creating a new group, the firm admin becomes the owner
 * Current user is added as a member if they're not already
 */
export const getOrCreateCaseGroup = async (
  caseId: string,
  caseName: string,
  firmId: string,
  currentUserId: string,
  currentUserName: string,
  isCurrentUserAdmin: boolean
): Promise<CometChat.Group> => {
  const GUID = `case_${caseId}`;

  try {
    // Try to get existing group
    const group = await CometChat.getGroup(GUID);
    return group;
  } catch (error: any) {
    if (error?.code === 'ERR_GUID_NOT_FOUND') {
      // Only admin can create groups
      if (!isCurrentUserAdmin) {
        throw new Error('Chat not initialized. Ask an admin to start the chat.');
      }

      // Get firm admin to make them the owner
      const admin = await getFirmAdmin(firmId);
      if (!admin) {
        throw new Error('No admin found for firm');
      }

      // Ensure admin exists in CometChat
      await ensureCometChatUser(admin.user_id, admin.full_name || 'Admin');

      // Create new private group (admin becomes owner automatically)
      const group = new CometChat.Group(
        GUID,
        caseName || 'Case Chat',
        CometChat.GROUP_TYPE.PRIVATE,
        ''
      );
      group.setDescription(`Chat for case ${caseId}`);

      const createdGroup = await CometChat.createGroup(group);
      
      // Add admin as first member with ADMIN scope
      try {
        const adminMember = new CometChat.GroupMember(
          admin.user_id, 
          CometChat.GROUP_MEMBER_SCOPE.ADMIN
        );
        await CometChat.addMembersToGroup(GUID, [adminMember], []);
      } catch (addError) {
        console.error('Error adding admin to group:', addError);
      }
      
      return createdGroup;
    }
    throw error;
  }
};

/**
 * Ensure a user exists in CometChat
 */
const ensureCometChatUser = async (userId: string, userName: string): Promise<void> => {
  try {
    await CometChat.getUser(userId);
  } catch (error: any) {
    if (error?.code === 'ERR_UID_NOT_FOUND') {
      // Create the user
      await createCometChatUser(userId, userName);
    } else {
      throw error;
    }
  }
};

/**
 * Add members to a case group
 */
export const addMembersToCaseGroup = async (
  caseId: string,
  memberIds: string[],
  memberNames: Record<string, string> // Map of userId -> userName
): Promise<void> => {
  const GUID = `case_${caseId}`;

  // Ensure all users exist in CometChat
  for (const memberId of memberIds) {
    const memberName = memberNames[memberId] || 'Unknown User';
    await ensureCometChatUser(memberId, memberName);
  }

  // Add members to group
  const groupMembers = memberIds.map(
    (id) => new CometChat.GroupMember(id, CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT)
  );

  try {
    await CometChat.addMembersToGroup(GUID, groupMembers, []);
  } catch (error) {
    console.error('Error adding members to group:', error);
    throw error;
  }
};

/**
 * Remove a member from a case group
 */
export const removeMemberFromCaseGroup = async (
  caseId: string,
  memberId: string
): Promise<void> => {
  const GUID = `case_${caseId}`;
  try {
    await CometChat.kickGroupMember(GUID, memberId);
  } catch (error) {
    console.error('Error removing member from group:', error);
    throw error;
  }
};

/**
 * Get all members of a case group
 */
export const getCaseGroupMembers = async (
  caseId: string
): Promise<CometChat.GroupMember[]> => {
  const GUID = `case_${caseId}`;
  try {
    const request = new CometChat.GroupMembersRequestBuilder(GUID)
      .setLimit(100)
      .build();
    return await request.fetchNext();
  } catch (error) {
    console.error('Error fetching group members:', error);
    return [];
  }
};

/**
 * Check if current user is a member of the group, if not add them
 */
export const ensureUserIsMember = async (
  caseId: string,
  userId: string,
  userName: string
): Promise<void> => {
  const GUID = `case_${caseId}`;
  
  try {
    // Check if user is already a member
    const members = await getCaseGroupMembers(caseId);
    const isMember = members.some(m => m.getUid() === userId);
    
    if (!isMember) {
      // Add user as member
      await ensureCometChatUser(userId, userName);
      const member = new CometChat.GroupMember(userId, CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT);
      await CometChat.addMembersToGroup(GUID, [member], []);
    }
  } catch (error) {
    console.error('Error ensuring user is member:', error);
    throw error;
  }
};
