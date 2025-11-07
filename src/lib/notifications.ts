import { supabase } from '@/integrations/supabase/client';

export interface SendNotificationParams {
  event_type: string;
  recipients: 'single' | 'team' | 'case_members' | 'assigned_users' | 'custom';
  recipient_ids?: string[];
  reference_id?: string;
  case_id?: string;
  firm_id?: string;
  title: string;
  message: string;
  category: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  action_url?: string;
  metadata?: any;
}

/**
 * Send notifications using the unified notification service
 */
export const sendNotification = async (params: SendNotificationParams) => {
  // Legacy notifications are now disabled. We rely on DB-triggered Knock notifications.
  console.info('[notifications] Skipping legacy notification send. Using Knock.', params);
  return { status: 'skipped_legacy' } as const;
};

// Helper functions for common notification scenarios

/**
 * Notify when a case is created
 */
export const notifyCaseCreated = async (
  caseId: string,
  caseTitle: string,
  firmId: string,
  assignedTo: string,
  assignedUsers: string[] = []
) => {
  const recipientIds = [assignedTo, ...assignedUsers].filter(Boolean);
  
  return sendNotification({
    event_type: 'case_created',
    recipients: 'custom',
    recipient_ids: recipientIds,
    reference_id: caseId,
    case_id: caseId,
    firm_id: firmId,
    title: 'New Case Created',
    message: `Case "${caseTitle}" has been created and assigned to you`,
    category: 'case',
    priority: 'normal',
    action_url: `/cases/${caseId}`,
    metadata: { case_title: caseTitle }
  });
};

/**
 * Notify when a case is updated
 */
export const notifyCaseUpdated = async (
  caseId: string,
  caseTitle: string,
  changeDescription: string
) => {
  return sendNotification({
    event_type: 'case_updated',
    recipients: 'case_members',
    case_id: caseId,
    reference_id: caseId,
    title: 'Case Updated',
    message: `Case "${caseTitle}" was updated: ${changeDescription}`,
    category: 'case',
    priority: 'normal',
    action_url: `/cases/${caseId}`,
    metadata: { case_title: caseTitle, change: changeDescription }
  });
};

/**
 * Notify when a case status changes
 */
export const notifyCaseStatusChanged = async (
  caseId: string,
  caseTitle: string,
  oldStatus: string,
  newStatus: string
) => {
  return sendNotification({
    event_type: 'case_status_changed',
    recipients: 'case_members',
    case_id: caseId,
    reference_id: caseId,
    title: 'Case Status Changed',
    message: `Case "${caseTitle}" status changed from ${oldStatus} to ${newStatus}`,
    category: 'case',
    priority: 'normal',
    action_url: `/cases/${caseId}`,
    metadata: { case_title: caseTitle, old_status: oldStatus, new_status: newStatus }
  });
};

/**
 * Notify when a case is closed
 */
export const notifyCaseClosed = async (
  caseId: string,
  caseTitle: string,
  firmId: string
) => {
  return sendNotification({
    event_type: 'case_closed',
    recipients: 'team',
    firm_id: firmId,
    reference_id: caseId,
    case_id: caseId,
    title: 'Case Closed',
    message: `Case "${caseTitle}" has been closed`,
    category: 'case',
    priority: 'normal',
    action_url: `/cases/${caseId}`,
    metadata: { case_title: caseTitle }
  });
};

/**
 * Notify when a hearing is scheduled
 */
export const notifyHearingScheduled = async (
  hearingId: string,
  caseId: string,
  caseTitle: string,
  hearingDate: string,
  courtName: string
) => {
  return sendNotification({
    event_type: 'hearing_scheduled',
    recipients: 'case_members',
    case_id: caseId,
    reference_id: hearingId,
    title: 'Hearing Scheduled',
    message: `New hearing scheduled for "${caseTitle}" on ${hearingDate} at ${courtName}`,
    category: 'hearing',
    priority: 'high',
    action_url: `/cases/${caseId}?tab=hearings`,
    metadata: { 
      case_title: caseTitle, 
      hearing_date: hearingDate,
      court_name: courtName 
    }
  });
};

/**
 * Notify when a hearing is updated
 */
export const notifyHearingUpdated = async (
  hearingId: string,
  caseId: string,
  caseTitle: string,
  hearingDate: string,
  changeDescription: string
) => {
  return sendNotification({
    event_type: 'hearing_updated',
    recipients: 'case_members',
    case_id: caseId,
    reference_id: hearingId,
    title: 'Hearing Updated',
    message: `Hearing for "${caseTitle}" on ${hearingDate} was updated: ${changeDescription}`,
    category: 'hearing',
    priority: 'high',
    action_url: `/cases/${caseId}?tab=hearings`,
    metadata: { 
      case_title: caseTitle, 
      hearing_date: hearingDate,
      change: changeDescription 
    }
  });
};

/**
 * Notify when a document is uploaded
 */
export const notifyDocumentUploaded = async (
  documentId: string,
  caseId: string,
  caseTitle: string,
  fileName: string,
  uploadedBy: string
) => {
  return sendNotification({
    event_type: 'document_uploaded',
    recipients: 'case_members',
    case_id: caseId,
    reference_id: documentId,
    title: 'Document Uploaded',
    message: `New document "${fileName}" uploaded to "${caseTitle}"`,
    category: 'document',
    priority: 'normal',
    action_url: `/cases/${caseId}?tab=documents`,
    metadata: { 
      case_title: caseTitle, 
      file_name: fileName,
      uploaded_by: uploadedBy 
    }
  });
};

/**
 * Notify when an invoice is created
 */
export const notifyInvoiceCreated = async (
  invoiceId: string,
  invoiceNumber: string,
  clientId: string,
  amount: number,
  firmId: string
) => {
  // Notify both the client and finance team
  const { data: financeTeam } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('firm_id', firmId)
    .in('role', ['admin', 'office_staff']);

  const recipientIds = [
    clientId,
    ...(financeTeam?.map(ft => ft.user_id) || [])
  ].filter(Boolean);

  return sendNotification({
    event_type: 'invoice_created',
    recipients: 'custom',
    recipient_ids: recipientIds,
    reference_id: invoiceId,
    firm_id: firmId,
    title: 'New Invoice',
    message: `Invoice ${invoiceNumber} for ₹${amount.toLocaleString()} has been created`,
    category: 'invoice',
    priority: 'normal',
    action_url: `/invoices/${invoiceId}`,
    metadata: { 
      invoice_number: invoiceNumber,
      amount: amount 
    }
  });
};

/**
 * Notify when a message is received
 */
export const notifyMessageReceived = async (
  messageId: string,
  caseId: string,
  caseTitle: string,
  senderName: string,
  messageContent: string
) => {
  return sendNotification({
    event_type: 'message_received',
    recipients: 'case_members',
    case_id: caseId,
    reference_id: messageId,
    title: `New message from ${senderName}`,
    message: messageContent.substring(0, 100),
    category: 'message',
    priority: 'normal',
    action_url: `/cases/${caseId}?tab=messages`,
    metadata: { 
      case_title: caseTitle,
      sender: senderName 
    }
  });
};

/**
 * Notify when a user is mentioned in a message
 */
export const notifyUserMentioned = async (
  messageId: string,
  mentionedUserId: string,
  caseId: string,
  caseTitle: string,
  senderName: string,
  messageContent: string
) => {
  return sendNotification({
    event_type: 'message_mention',
    recipients: 'single',
    recipient_ids: [mentionedUserId],
    reference_id: messageId,
    case_id: caseId,
    title: `${senderName} mentioned you`,
    message: messageContent.substring(0, 100),
    category: 'message',
    priority: 'high',
    action_url: `/cases/${caseId}?tab=messages`,
    metadata: {
      case_title: caseTitle,
      sender: senderName
    }
  });
};

/**
 * Notify when a user is added to the team
 */
export const notifyUserAdded = async (
  userId: string,
  userName: string,
  userRole: string,
  firmId: string,
  addedBy: string
) => {
  // Get all admins except the one who added
  const { data: admins } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('firm_id', firmId)
    .eq('role', 'admin')
    .neq('user_id', addedBy);

  const adminIds = admins?.map(admin => admin.user_id) || [];

  if (adminIds.length === 0) {
    return;
  }

  return sendNotification({
    event_type: 'user_added',
    recipients: 'custom',
    recipient_ids: adminIds,
    reference_id: userId,
    firm_id: firmId,
    title: 'New Team Member Added',
    message: `${userName} has been added as ${userRole}`,
    category: 'system',
    priority: 'normal',
    action_url: '/team',
    metadata: {
      user_id: userId,
      user_name: userName,
      role: userRole,
      added_by: addedBy
    }
  });
};

/**
 * Notify when a user's role changes
 */
export const notifyRoleChanged = async (
  userId: string,
  userName: string,
  oldRole: string,
  newRole: string
) => {
  return sendNotification({
    event_type: 'role_changed',
    recipients: 'single',
    recipient_ids: [userId],
    reference_id: userId,
    title: 'Your Role Has Been Updated',
    message: `Your role has been changed from ${oldRole} to ${newRole}`,
    category: 'system',
    priority: 'high',
    action_url: '/team',
    metadata: {
      user_name: userName,
      old_role: oldRole,
      new_role: newRole
    }
  });
};

/**
 * Notify security alert
 */
export const notifySecurityAlert = async (
  userId: string,
  alertType: string,
  alertMessage: string,
  metadata?: any
) => {
  return sendNotification({
    event_type: 'security_alert',
    recipients: 'single',
    recipient_ids: [userId],
    reference_id: userId,
    title: 'Security Alert',
    message: alertMessage,
    category: 'system',
    priority: 'urgent',
    action_url: '/settings',
    metadata: {
      alert_type: alertType,
      ...metadata
    }
  });
};
