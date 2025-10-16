import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  record: Record<string, any>;
  userId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const novuApiKey = Deno.env.get('NOVU_API_KEY');
    if (!novuApiKey) {
      throw new Error('NOVU_API_KEY not configured');
    }

    const body: NotificationPayload = await req.json();
    console.log('Received notification request:', { table: body.table, eventType: body.eventType });

    const { table, eventType, record } = body;

    const message = constructMessage(table, eventType, record);
    const subscriberId = determineSubscriberId(table, record);

    if (!subscriberId) {
      console.warn('No subscriber ID found, skipping notification');
      return new Response(
        JSON.stringify({ status: 'skipped', reason: 'No subscriber ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending notification to Novu:', { subscriberId, message: message.substring(0, 50) });

    // First, ensure subscriber exists in Novu
    try {
      await fetch(`https://api.novu.co/v1/subscribers`, {
        method: 'POST',
        headers: {
          'Authorization': `ApiKey ${novuApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriberId: subscriberId,
        }),
      });
      console.log('Subscriber registered/updated in Novu');
    } catch (subError) {
      console.log('Subscriber may already exist:', subError);
    }

    // Trigger the notification
    const response = await fetch('https://api.novu.co/v1/events/trigger', {
      method: 'POST',
      headers: {
        'Authorization': `ApiKey ${novuApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'in-app',
        to: {
          subscriberId: subscriberId,
        },
        payload: {
          message: message,
          table: table,
          eventType: eventType,
          recordId: record.id,
          timestamp: new Date().toISOString(),
        },
      }),
    });

    const data = await response.json();
    console.log('Novu trigger response:', data);

    if (!response.ok) {
      console.error('Novu API error:', data);
      throw new Error(`Novu API error: ${JSON.stringify(data)}`);
    }

    return new Response(
      JSON.stringify({ status: 'ok', data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Error in notify-novu function:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function constructMessage(table: string, eventType: string, record: Record<string, any>): string {
  switch (table) {
    case 'cases':
      if (eventType === 'INSERT') {
        return `New case "${record.case_title || 'Untitled'}" has been created.`;
      } else if (eventType === 'UPDATE') {
        return `Case "${record.case_title || 'Untitled'}" has been updated.`;
      }
      return `Case "${record.case_title || 'Untitled'}" status changed.`;

    case 'tasks':
      if (eventType === 'INSERT') {
        return `New task "${record.title || 'Untitled'}" was assigned to you.`;
      } else if (eventType === 'UPDATE' && record.status === 'completed') {
        return `Task "${record.title || 'Untitled'}" has been completed.`;
      }
      return `Task "${record.title || 'Untitled'}" was updated.`;

    case 'appointments':
      if (eventType === 'INSERT') {
        const date = record.appointment_date || record.start_time;
        return `New appointment scheduled for ${date ? new Date(date).toLocaleDateString() : 'upcoming'}.`;
      } else if (eventType === 'UPDATE') {
        return `Appointment details have been updated.`;
      }
      return 'Appointment notification.';

    case 'hearings':
      if (eventType === 'INSERT') {
        const hearingDate = record.hearing_date ? new Date(record.hearing_date).toLocaleDateString() : 'upcoming';
        return `New hearing scheduled for ${hearingDate}.`;
      }
      return `Hearing update for case.`;

    case 'documents':
      if (eventType === 'INSERT') {
        return `New document "${record.file_name || 'document'}" was uploaded.`;
      }
      return 'Document notification.';

    case 'clients':
      if (eventType === 'INSERT') {
        return `New client "${record.full_name || 'client'}" has been added.`;
      }
      return 'Client information updated.';

    default:
      return `Update in ${table}: ${eventType}`;
  }
}

function determineSubscriberId(table: string, record: Record<string, any>): string | null {
  if (record.user_id) return record.user_id;
  if (record.assigned_to) return record.assigned_to;
  if (record.created_by) return record.created_by;
  if (record.lawyer_id) return record.lawyer_id;
  
  if (record.assigned_users && Array.isArray(record.assigned_users) && record.assigned_users.length > 0) {
    return record.assigned_users[0];
  }
  
  return null;
}