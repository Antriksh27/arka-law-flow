import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const knockApiKey = Deno.env.get("KNOCK_API_KEY");
    if (!knockApiKey) {
      console.error("❌ KNOCK_API_KEY not configured");
      throw new Error("KNOCK_API_KEY not configured");
    }

    const { table, eventType, record } = await req.json();
    console.log(`📬 Notification trigger: ${eventType} on ${table}`, { recordId: record?.id });

    const notification = buildNotification(table, eventType, record);
    
    if (!notification) {
      console.log(`ℹ️ No notification needed for ${eventType} on ${table}`);
      return new Response(
        JSON.stringify({ message: 'No notification needed for this event' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`🔔 Sending Knock notification to user: ${notification.recipientId}`);

    const response = await fetch('https://api.knock.app/v1/workflows/notify-user/trigger', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${knockApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: [notification.recipientId],
        data: {
          title: notification.title,
          message: notification.message,
          actionUrl: notification.actionUrl,
          metadata: {
            table,
            eventType,
            recordId: record.id,
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Knock API error:', data);
      throw new Error(data.message || 'Failed to trigger Knock notification');
    }

    console.log('✅ Knock notification sent successfully');
    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in notify-knock function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildNotification(table: string, eventType: string, record: any) {
  switch (table) {
    case 'appointments':
      if (eventType === 'INSERT') {
        return {
          recipientId: record.lawyer_id || record.created_by,
          title: 'New Appointment Scheduled',
          message: `Appointment with ${record.client_name || 'client'} on ${record.appointment_date}`,
          actionUrl: `/appointments`,
        };
      }
      if (eventType === 'UPDATE' && record.status) {
        return {
          recipientId: record.lawyer_id || record.created_by,
          title: 'Appointment Updated',
          message: `Appointment status changed to ${record.status}`,
          actionUrl: `/appointments`,
        };
      }
      break;

    case 'cases':
      if (eventType === 'INSERT') {
        return {
          recipientId: record.assigned_lawyer_id || record.created_by,
          title: 'New Case Created',
          message: `Case "${record.case_title}" has been created`,
          actionUrl: `/cases/${record.id}`,
        };
      }
      if (eventType === 'UPDATE' && record.status) {
        return {
          recipientId: record.assigned_lawyer_id || record.created_by,
          title: 'Case Status Updated',
          message: `Case "${record.case_title}" status changed to ${record.status}`,
          actionUrl: `/cases/${record.id}`,
        };
      }
      break;

    case 'hearings':
      if (eventType === 'INSERT') {
        return {
          recipientId: record.lawyer_id || record.created_by,
          title: 'New Hearing Scheduled',
          message: `Hearing on ${record.hearing_date} at ${record.court_name}`,
          actionUrl: `/hearings`,
        };
      }
      if (eventType === 'UPDATE' && record.hearing_date) {
        return {
          recipientId: record.lawyer_id || record.created_by,
          title: 'Hearing Rescheduled',
          message: `Hearing rescheduled to ${record.hearing_date}`,
          actionUrl: `/hearings`,
        };
      }
      break;

    case 'tasks':
      if (eventType === 'INSERT' && record.assigned_to) {
        return {
          recipientId: record.assigned_to,
          title: 'New Task Assigned',
          message: `Task: ${record.title}`,
          actionUrl: `/tasks`,
        };
      }
      if (eventType === 'UPDATE' && record.status === 'completed') {
        return {
          recipientId: record.created_by,
          title: 'Task Completed',
          message: `Task "${record.title}" has been completed`,
          actionUrl: `/tasks`,
        };
      }
      break;

    case 'documents':
      if (eventType === 'INSERT' && record.case_id) {
        return {
          recipientId: record.uploaded_by || record.uploaded_by_user_id,
          title: 'Document Uploaded',
          message: `Document "${record.file_name}" uploaded successfully`,
          actionUrl: `/documents`,
        };
      }
      break;

    case 'messages':
      if (eventType === 'INSERT' && record.recipient_id) {
        return {
          recipientId: record.recipient_id,
          title: 'New Message',
          message: record.content?.substring(0, 100) || 'You have a new message',
          actionUrl: `/messages`,
        };
      }
      break;
  }

  return null;
}
