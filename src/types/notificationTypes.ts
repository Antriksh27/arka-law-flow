// Notification Event Types - All 87 types organized by category

export type NotificationCategory = 
  | 'case' 
  | 'hearing' 
  | 'appointment' 
  | 'task' 
  | 'document' 
  | 'invoice' 
  | 'message' 
  | 'client' 
  | 'team' 
  | 'note' 
  | 'ecourts' 
  | 'legal_news' 
  | 'system';

export type NotificationFrequency = 'instant' | 'digest' | 'off';
export type NotificationPriorityFilter = 'all' | 'normal' | 'high' | 'urgent';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationEventType {
  id: string;
  label: string;
  description: string;
  category: NotificationCategory;
  defaultEnabled: boolean;
  defaultPriority: NotificationPriority;
}

export const NOTIFICATION_EVENTS: Record<string, NotificationEventType[]> = {
  case: [
    { id: 'case_created', label: 'Case Created', description: 'New case is created', category: 'case', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'case_updated', label: 'Case Updated', description: 'Case details are modified', category: 'case', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'case_status_changed', label: 'Status Changed', description: 'Case status changes', category: 'case', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'case_assigned', label: 'Case Assigned', description: 'Case is assigned to you', category: 'case', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'case_unassigned', label: 'Case Unassigned', description: 'Case is unassigned from you', category: 'case', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'case_client_linked', label: 'Client Linked', description: 'Client is linked to case', category: 'case', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'case_note_added', label: 'Note Added', description: 'Internal note added to case', category: 'case', defaultEnabled: false, defaultPriority: 'low' },
    { id: 'case_deadline_approaching', label: 'Deadline Approaching', description: 'Case deadline is near', category: 'case', defaultEnabled: true, defaultPriority: 'urgent' },
    { id: 'case_ecourts_update', label: 'eCourts Update', description: 'eCourts data updated for case', category: 'case', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'case_document_uploaded', label: 'Document Uploaded', description: 'Document uploaded to case', category: 'case', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'case_disposed', label: 'Case Disposed', description: 'Case marked as disposed', category: 'case', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'case_research_completed', label: 'Research Completed', description: 'Legal research completed', category: 'case', defaultEnabled: true, defaultPriority: 'normal' },
  ],
  
  hearing: [
    { id: 'hearing_scheduled', label: 'Hearing Scheduled', description: 'New hearing scheduled', category: 'hearing', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'hearing_updated', label: 'Hearing Updated', description: 'Hearing details modified', category: 'hearing', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'hearing_cancelled', label: 'Hearing Cancelled', description: 'Hearing is cancelled', category: 'hearing', defaultEnabled: true, defaultPriority: 'urgent' },
    { id: 'hearing_reminder', label: 'Hearing Reminder', description: 'Upcoming hearing reminder', category: 'hearing', defaultEnabled: true, defaultPriority: 'urgent' },
    { id: 'hearing_outcome_recorded', label: 'Outcome Recorded', description: 'Hearing outcome documented', category: 'hearing', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'next_hearing_set', label: 'Next Hearing Set', description: 'Next hearing date scheduled', category: 'hearing', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'hearing_document_uploaded', label: 'Document Uploaded', description: 'Document for hearing uploaded', category: 'hearing', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'court_order_received', label: 'Court Order Received', description: 'Court order received', category: 'hearing', defaultEnabled: true, defaultPriority: 'urgent' },
    { id: 'cause_list_published', label: 'Cause List Published', description: 'Cause list published by court', category: 'hearing', defaultEnabled: true, defaultPriority: 'high' },
  ],
  
  appointment: [
    { id: 'appointment_created', label: 'Appointment Created', description: 'New appointment scheduled', category: 'appointment', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'appointment_updated', label: 'Appointment Updated', description: 'Appointment details changed', category: 'appointment', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'appointment_cancelled', label: 'Appointment Cancelled', description: 'Appointment is cancelled', category: 'appointment', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'appointment_reminder', label: 'Appointment Reminder', description: 'Upcoming appointment reminder', category: 'appointment', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'appointment_confirmed', label: 'Appointment Confirmed', description: 'Client confirmed appointment', category: 'appointment', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'appointment_reschedule_request', label: 'Reschedule Request', description: 'Client requests reschedule', category: 'appointment', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'walk_in_appointment', label: 'Walk-in Client', description: 'Walk-in client arrival', category: 'appointment', defaultEnabled: true, defaultPriority: 'urgent' },
  ],
  
  task: [
    { id: 'task_assigned', label: 'Task Assigned', description: 'Task assigned to you', category: 'task', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'task_reassigned', label: 'Task Reassigned', description: 'Task reassigned to someone else', category: 'task', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'task_due_tomorrow', label: 'Due Tomorrow', description: 'Task due tomorrow', category: 'task', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'task_due_today', label: 'Due Today', description: 'Task due today', category: 'task', defaultEnabled: true, defaultPriority: 'urgent' },
    { id: 'task_overdue', label: 'Task Overdue', description: 'Task is overdue', category: 'task', defaultEnabled: true, defaultPriority: 'urgent' },
    { id: 'task_completed', label: 'Task Completed', description: 'Task marked as completed', category: 'task', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'task_comment_added', label: 'Comment Added', description: 'Comment added to task', category: 'task', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'task_priority_changed', label: 'Priority Changed', description: 'Task priority updated', category: 'task', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'task_attachment_added', label: 'Attachment Added', description: 'File attached to task', category: 'task', defaultEnabled: false, defaultPriority: 'low' },
  ],
  
  document: [
    { id: 'document_uploaded', label: 'Document Uploaded', description: 'New document uploaded', category: 'document', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'document_shared', label: 'Document Shared', description: 'Document shared with you', category: 'document', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'document_review_required', label: 'Review Required', description: 'Document needs your review', category: 'document', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'document_signature_required', label: 'Signature Required', description: 'Document needs signature', category: 'document', defaultEnabled: true, defaultPriority: 'urgent' },
    { id: 'document_signed', label: 'Document Signed', description: 'Document has been signed', category: 'document', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'document_version_updated', label: 'Version Updated', description: 'New version uploaded', category: 'document', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'document_access_changed', label: 'Access Changed', description: 'Document permissions updated', category: 'document', defaultEnabled: true, defaultPriority: 'normal' },
  ],
  
  invoice: [
    { id: 'invoice_created', label: 'Invoice Created', description: 'New invoice generated', category: 'invoice', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'invoice_sent', label: 'Invoice Sent', description: 'Invoice sent to client', category: 'invoice', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'payment_received', label: 'Payment Received', description: 'Payment received for invoice', category: 'invoice', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'payment_failed', label: 'Payment Failed', description: 'Payment attempt failed', category: 'invoice', defaultEnabled: true, defaultPriority: 'urgent' },
    { id: 'invoice_overdue', label: 'Invoice Overdue', description: 'Invoice is overdue', category: 'invoice', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'payment_reminder_sent', label: 'Reminder Sent', description: 'Payment reminder sent', category: 'invoice', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'invoice_cancelled', label: 'Invoice Cancelled', description: 'Invoice has been cancelled', category: 'invoice', defaultEnabled: true, defaultPriority: 'normal' },
  ],
  
  message: [
    { id: 'message_received', label: 'Message Received', description: 'New message received', category: 'message', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'message_mention', label: 'Mentioned', description: 'You were mentioned', category: 'message', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'direct_message', label: 'Direct Message', description: 'Direct message received', category: 'message', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'thread_reply', label: 'Thread Reply', description: 'Reply in thread you follow', category: 'message', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'message_flagged', label: 'Message Flagged', description: 'Message marked as important', category: 'message', defaultEnabled: true, defaultPriority: 'high' },
  ],
  
  client: [
    { id: 'client_created', label: 'Client Created', description: 'New client added', category: 'client', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'client_assigned', label: 'Client Assigned', description: 'Client assigned to you', category: 'client', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'client_updated', label: 'Client Updated', description: 'Client information updated', category: 'client', defaultEnabled: false, defaultPriority: 'low' },
    { id: 'engagement_letter_sent', label: 'Engagement Letter Sent', description: 'Engagement letter sent', category: 'client', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'engagement_letter_signed', label: 'Letter Signed', description: 'Engagement letter signed', category: 'client', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'contact_converted', label: 'Contact Converted', description: 'Contact converted to client', category: 'client', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'client_birthday', label: 'Client Birthday', description: 'Client birthday reminder', category: 'client', defaultEnabled: false, defaultPriority: 'low' },
    { id: 'client_anniversary', label: 'Case Anniversary', description: 'Case anniversary reminder', category: 'client', defaultEnabled: false, defaultPriority: 'low' },
  ],
  
  team: [
    { id: 'team_member_joined', label: 'Member Joined', description: 'New team member added', category: 'team', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'team_member_role_changed', label: 'Role Changed', description: 'Team member role updated', category: 'team', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'team_member_left', label: 'Member Left', description: 'Team member removed', category: 'team', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'workload_assigned', label: 'Workload Assigned', description: 'Work assigned to team', category: 'team', defaultEnabled: true, defaultPriority: 'high' },
  ],
  
  note: [
    { id: 'note_shared', label: 'Note Shared', description: 'Note shared with you', category: 'note', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'note_mention', label: 'Mentioned in Note', description: 'You were mentioned in note', category: 'note', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'note_pinned', label: 'Note Pinned', description: 'Note pinned to dashboard', category: 'note', defaultEnabled: false, defaultPriority: 'low' },
    { id: 'note_visibility_changed', label: 'Visibility Changed', description: 'Note visibility updated', category: 'note', defaultEnabled: false, defaultPriority: 'low' },
  ],
  
  ecourts: [
    { id: 'ecourts_fetch_completed', label: 'Fetch Completed', description: 'eCourts data fetch complete', category: 'ecourts', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'ecourts_hearing_updated', label: 'Hearing Updated', description: 'eCourts hearing data updated', category: 'ecourts', defaultEnabled: true, defaultPriority: 'urgent' },
    { id: 'ecourts_status_updated', label: 'Status Updated', description: 'Case status updated in eCourts', category: 'ecourts', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'ecourts_document_available', label: 'Document Available', description: 'New document in eCourts', category: 'ecourts', defaultEnabled: true, defaultPriority: 'high' },
  ],
  
  legal_news: [
    { id: 'legal_news_update', label: 'Legal News', description: 'New legal news article', category: 'legal_news', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'court_judgment_alert', label: 'Judgment Alert', description: 'Important court judgment', category: 'legal_news', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'law_change_alert', label: 'Law Change', description: 'Legal statute changed', category: 'legal_news', defaultEnabled: true, defaultPriority: 'high' },
  ],
  
  system: [
    { id: 'login_new_device', label: 'New Device Login', description: 'Login from new device', category: 'system', defaultEnabled: true, defaultPriority: 'urgent' },
    { id: 'password_changed', label: 'Password Changed', description: 'Password was changed', category: 'system', defaultEnabled: true, defaultPriority: 'urgent' },
    { id: '2fa_enabled', label: '2FA Enabled', description: 'Two-factor auth enabled', category: 'system', defaultEnabled: true, defaultPriority: 'high' },
    { id: 'unusual_activity', label: 'Unusual Activity', description: 'Suspicious activity detected', category: 'system', defaultEnabled: true, defaultPriority: 'urgent' },
    { id: 'system_maintenance', label: 'Maintenance', description: 'Scheduled maintenance alert', category: 'system', defaultEnabled: true, defaultPriority: 'normal' },
    { id: 'license_renewal', label: 'License Renewal', description: 'License renewal reminder', category: 'system', defaultEnabled: true, defaultPriority: 'high' },
  ],
};

export const CATEGORY_INFO: Record<NotificationCategory, { label: string; description: string; icon: string }> = {
  case: { label: 'Cases', description: 'Notifications about case updates and activities', icon: 'Briefcase' },
  hearing: { label: 'Hearings', description: 'Court hearings and related updates', icon: 'Gavel' },
  appointment: { label: 'Appointments', description: 'Client appointments and consultations', icon: 'Calendar' },
  task: { label: 'Tasks', description: 'Task assignments and deadlines', icon: 'CheckSquare' },
  document: { label: 'Documents', description: 'Document uploads and reviews', icon: 'FileText' },
  invoice: { label: 'Invoices', description: 'Billing and payment notifications', icon: 'Receipt' },
  message: { label: 'Messages', description: 'Team messages and mentions', icon: 'MessageSquare' },
  client: { label: 'Clients', description: 'Client-related activities', icon: 'Users' },
  team: { label: 'Team', description: 'Team member updates', icon: 'UserPlus' },
  note: { label: 'Notes', description: 'Note sharing and mentions', icon: 'StickyNote' },
  ecourts: { label: 'eCourts', description: 'eCourts data updates', icon: 'Globe' },
  legal_news: { label: 'Legal News', description: 'Legal news and updates', icon: 'Newspaper' },
  system: { label: 'System', description: 'System and security alerts', icon: 'Shield' },
};

export interface CategoryPreferences {
  enabled: boolean;
  frequency: NotificationFrequency;
  priority_filter: NotificationPriorityFilter;
}

export interface NotificationPreferences {
  id?: string;
  user_id?: string;
  firm_id?: string;
  enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  delivery_preferences: {
    in_app: boolean;
    email: boolean;
    browser: boolean;
    sound: boolean;
  };
  categories: Record<NotificationCategory, CategoryPreferences>;
  event_preferences: Record<string, { enabled: boolean }>;
  digest_frequency: 'never' | 'hourly' | 'daily' | 'weekly';
  digest_time: string;
  muted_cases: string[];
  muted_clients: string[];
  muted_users: string[];
  created_at?: string;
  updated_at?: string;
}
