import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const request: NotificationRequest = await req.json();
    
    console.log('Processing smart notification:', {
      event_type: request.event_type,
      category: request.category,
      priority: request.priority,
    });

    // 1. Resolve recipient list
    let recipientIds: string[] = await resolveRecipients(supabase, request);

    if (recipientIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No recipients found', sent: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    let sentCount = 0;
    let queuedCount = 0;
    let skippedCount = 0;

    // 2. Process each recipient with their preferences
    for (const userId of recipientIds) {
      const prefs = await getUserPreferences(supabase, userId);

      // 3. Check if notification should be sent
      if (!shouldSendNotification(prefs, request)) {
        console.log(`Skipping notification for user ${userId} - disabled in preferences`);
        skippedCount++;
        continue;
      }

      // 4. Check if entity is muted
      if (isEntityMuted(prefs, request)) {
        console.log(`Skipping notification for user ${userId} - entity muted`);
        skippedCount++;
        continue;
      }

      // 5. Check quiet hours
      if (isInQuietHours(prefs)) {
        console.log(`Queueing notification for user ${userId} - quiet hours active`);
        await queueForLater(supabase, userId, request);
        queuedCount++;
        continue;
      }

      // 6. Determine frequency
      const frequency = getNotificationFrequency(prefs, request.category);

      if (frequency === 'instant') {
        // Send immediately
        await deliverNotification(supabase, userId, request, prefs);
        sentCount++;
      } else if (frequency === 'digest') {
        // Add to digest batch
        await addToDigestBatch(supabase, userId, request);
        queuedCount++;
      }
    }

    console.log(`Notification processing complete: ${sentCount} sent, ${queuedCount} queued, ${skippedCount} skipped`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        queued: queuedCount,
        skipped: skippedCount,
        total: recipientIds.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in send-smart-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

// Helper functions

async function resolveRecipients(supabase: any, request: NotificationRequest): Promise<string[]> {
  let recipientIds: string[] = [];

  switch (request.recipients) {
    case 'single':
    case 'custom':
    case 'assigned_users':
      recipientIds = request.recipient_ids || [];
      break;

    case 'team':
      if (!request.firm_id) throw new Error('firm_id required for team recipient type');
      
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('firm_id', request.firm_id);

      recipientIds = teamMembers?.map((tm: any) => tm.user_id) || [];
      break;

    case 'case_members':
      if (!request.case_id) throw new Error('case_id required for case_members recipient type');

      const { data: caseData } = await supabase
        .from('cases')
        .select('created_by, assigned_to, assigned_users')
        .eq('id', request.case_id)
        .single();

      if (caseData) {
        recipientIds = [
          caseData.created_by,
          caseData.assigned_to,
          ...(caseData.assigned_users || [])
        ].filter((id: any, index: number, self: any[]) => id && self.indexOf(id) === index);
      }
      break;
  }

  return recipientIds;
}

async function getUserPreferences(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    // Return default preferences
    return {
      enabled: true,
      quiet_hours_enabled: false,
      categories: {},
      event_preferences: {},
      muted_cases: [],
      muted_clients: [],
      muted_users: [],
      delivery_preferences: { in_app: true, email: true, browser: true, sound: true }
    };
  }

  return data;
}

function shouldSendNotification(prefs: any, request: NotificationRequest): boolean {
  // Check global enabled
  if (!prefs.enabled) return false;

  // Check category preference
  const categoryPref = prefs.categories?.[request.category];
  if (categoryPref && !categoryPref.enabled) return false;

  // Check event preference override
  const eventPref = prefs.event_preferences?.[request.event_type];
  if (eventPref && !eventPref.enabled) return false;

  // Check priority filter
  if (categoryPref?.priority_filter) {
    const notifPriority = request.priority || 'normal';
    const filter = categoryPref.priority_filter;

    if (filter === 'urgent' && notifPriority !== 'urgent') return false;
    if (filter === 'high' && !['urgent', 'high'].includes(notifPriority)) return false;
  }

  return true;
}

function isEntityMuted(prefs: any, request: NotificationRequest): boolean {
  if (request.case_id && prefs.muted_cases?.includes(request.case_id)) return true;
  if (request.metadata?.client_id && prefs.muted_clients?.includes(request.metadata.client_id)) return true;
  if (request.metadata?.user_id && prefs.muted_users?.includes(request.metadata.user_id)) return true;
  return false;
}

function isInQuietHours(prefs: any): boolean {
  if (!prefs.quiet_hours_enabled) return false;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = (prefs.quiet_hours_start || '22:00').split(':').map(Number);
  const [endHour, endMin] = (prefs.quiet_hours_end || '08:00').split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  if (startTime < endTime) {
    return currentTime >= startTime && currentTime < endTime;
  } else {
    // Crosses midnight
    return currentTime >= startTime || currentTime < endTime;
  }
}

function getNotificationFrequency(prefs: any, category: string): string {
  return prefs.categories?.[category]?.frequency || 'instant';
}

async function deliverNotification(supabase: any, userId: string, request: NotificationRequest, prefs: any) {
  const deliveryChannels = prefs.delivery_preferences?.in_app !== false ? ['in_app'] : [];

  const { error } = await supabase
    .from('notifications')
    .insert({
      recipient_id: userId,
      notification_type: request.event_type,
      title: request.title,
      message: request.message,
      reference_id: request.reference_id,
      category: request.category,
      priority: request.priority || 'normal',
      action_url: request.action_url,
      metadata: request.metadata || {},
      delivery_channel: deliveryChannels,
      delivery_status: 'delivered',
      read: false,
    });

  if (error) {
    console.error('Error delivering notification:', error);
    throw error;
  }
}

async function queueForLater(supabase: any, userId: string, request: NotificationRequest) {
  // Queue notification to be sent after quiet hours
  const prefs = await getUserPreferences(supabase, userId);
  const [endHour, endMin] = (prefs.quiet_hours_end || '08:00').split(':').map(Number);
  
  const now = new Date();
  const deliverAt = new Date(now);
  deliverAt.setHours(endHour, endMin, 0, 0);
  
  // If end time is earlier today, schedule for tomorrow
  if (deliverAt <= now) {
    deliverAt.setDate(deliverAt.getDate() + 1);
  }

  await supabase
    .from('notifications')
    .insert({
      recipient_id: userId,
      notification_type: request.event_type,
      title: request.title,
      message: request.message,
      reference_id: request.reference_id,
      category: request.category,
      priority: request.priority || 'normal',
      action_url: request.action_url,
      metadata: request.metadata || {},
      delivery_channel: ['in_app'],
      delivery_status: 'pending',
      read: false,
      snoozed_until: deliverAt.toISOString(),
    });
}

async function addToDigestBatch(supabase: any, userId: string, request: NotificationRequest) {
  // Add to digest batch - will be sent by digest job
  const batchId = `digest_${userId}_${new Date().toISOString().split('T')[0]}`;

  await supabase
    .from('notifications')
    .insert({
      recipient_id: userId,
      notification_type: request.event_type,
      title: request.title,
      message: request.message,
      reference_id: request.reference_id,
      category: request.category,
      priority: request.priority || 'normal',
      action_url: request.action_url,
      metadata: request.metadata || {},
      delivery_channel: ['email'],
      delivery_status: 'pending',
      read: false,
      digest_batch_id: batchId,
    });
}
