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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const notificationRequest: NotificationRequest = await req.json();
    
    console.log('Processing notification request:', {
      event_type: notificationRequest.event_type,
      recipients: notificationRequest.recipients,
      category: notificationRequest.category,
    });

    // Determine recipient list
    let recipientIds: string[] = [];

    switch (notificationRequest.recipients) {
      case 'single':
        if (!notificationRequest.recipient_ids || notificationRequest.recipient_ids.length === 0) {
          throw new Error('recipient_ids required for single recipient type');
        }
        recipientIds = [notificationRequest.recipient_ids[0]];
        break;

      case 'custom':
        if (!notificationRequest.recipient_ids || notificationRequest.recipient_ids.length === 0) {
          throw new Error('recipient_ids required for custom recipient type');
        }
        recipientIds = notificationRequest.recipient_ids;
        break;

      case 'assigned_users':
        if (!notificationRequest.recipient_ids || notificationRequest.recipient_ids.length === 0) {
          throw new Error('recipient_ids required for assigned_users recipient type');
        }
        recipientIds = notificationRequest.recipient_ids;
        break;

      case 'team':
        // Get all team members in the firm
        if (!notificationRequest.firm_id) {
          throw new Error('firm_id required for team recipient type');
        }
        
        const { data: teamMembers, error: teamError } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('firm_id', notificationRequest.firm_id);

        if (teamError) {
          console.error('Error fetching team members:', teamError);
          throw teamError;
        }

        recipientIds = teamMembers?.map(tm => tm.user_id) || [];
        console.log(`Found ${recipientIds.length} team members`);
        break;

      case 'case_members':
        // Get all users assigned to the case
        if (!notificationRequest.case_id) {
          throw new Error('case_id required for case_members recipient type');
        }

        const { data: caseData, error: caseError } = await supabase
          .from('cases')
          .select('created_by, assigned_to, assigned_users')
          .eq('id', notificationRequest.case_id)
          .single();

        if (caseError) {
          console.error('Error fetching case data:', caseError);
          throw caseError;
        }

        if (caseData) {
          recipientIds = [
            caseData.created_by,
            caseData.assigned_to,
            ...(caseData.assigned_users || [])
          ].filter((id, index, self) => id && self.indexOf(id) === index); // Remove nulls and duplicates
          
          console.log(`Found ${recipientIds.length} case members`);
        }
        break;

      default:
        throw new Error(`Unknown recipient type: ${notificationRequest.recipients}`);
    }

    if (recipientIds.length === 0) {
      console.warn('No recipients found for notification');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No recipients found',
          recipients_count: 0 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Create notification records for each recipient
    const notifications = recipientIds.map(recipientId => ({
      recipient_id: recipientId,
      notification_type: notificationRequest.event_type,
      title: notificationRequest.title,
      message: notificationRequest.message,
      reference_id: notificationRequest.reference_id,
      category: notificationRequest.category,
      priority: notificationRequest.priority || 'normal',
      action_url: notificationRequest.action_url,
      metadata: notificationRequest.metadata || {},
      read: false,
      created_at: new Date().toISOString(),
    }));

    console.log(`Inserting ${notifications.length} notifications`);

    const { data: insertedNotifications, error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (insertError) {
      console.error('Error inserting notifications:', insertError);
      throw insertError;
    }

    console.log(`Successfully created ${insertedNotifications?.length || 0} notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notifications sent successfully',
        recipients_count: recipientIds.length,
        notifications_created: insertedNotifications?.length || 0
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in send-notification function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});
