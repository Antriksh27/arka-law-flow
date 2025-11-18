/**
 * Shared notification helper functions
 * Used by database triggers to send notifications
 */

export async function sendNotification(params: {
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
}) {
  const functionUrl = Deno.env.get('SUPABASE_URL') + '/functions/v1/send-smart-notification';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(params),
    });

    const result = await response.json();
    console.log('Notification sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send notification:', error);
    throw error;
  }
}
