import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, record, old_record } = await req.json();
    
    const functionUrl = Deno.env.get('SUPABASE_URL') + '/functions/v1/send-smart-notification';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const sendNotif = async (params: any) => {
      await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify(params),
      });
    };

    const recipients = [record.lawyer_id, record.client_id, record.created_by_user_id].filter(Boolean);

    // Appointment created
    if (type === 'INSERT') {
      await sendNotif({
        event_type: 'appointment_created',
        recipients: 'custom',
        recipient_ids: recipients,
        reference_id: record.id,
        firm_id: record.firm_id,
        title: 'New Appointment Scheduled',
        message: `Appointment scheduled for ${record.appointment_date} at ${record.appointment_time}`,
        category: 'appointment',
        priority: 'high',
        action_url: `/appointments`,
        metadata: { 
          date: record.appointment_date,
          time: record.appointment_time,
          title: record.title 
        },
      });
    }

    // Appointment updated
    if (type === 'UPDATE') {
      // Date/time changed
      if (old_record.appointment_date !== record.appointment_date || 
          old_record.appointment_time !== record.appointment_time) {
        await sendNotif({
          event_type: 'appointment_updated',
          recipients: 'custom',
          recipient_ids: recipients,
          reference_id: record.id,
          firm_id: record.firm_id,
          title: 'Appointment Rescheduled',
          message: `Appointment rescheduled to ${record.appointment_date} at ${record.appointment_time}`,
          category: 'appointment',
          priority: 'urgent',
          action_url: `/appointments`,
          metadata: { 
            old_date: old_record.appointment_date,
            new_date: record.appointment_date 
          },
        });
      }

      // Status changed to cancelled
      if (old_record.status !== 'cancelled' && record.status === 'cancelled') {
        await sendNotif({
          event_type: 'appointment_cancelled',
          recipients: 'custom',
          recipient_ids: recipients,
          reference_id: record.id,
          firm_id: record.firm_id,
          title: 'Appointment Cancelled',
          message: `Appointment on ${record.appointment_date} has been cancelled`,
          category: 'appointment',
          priority: 'high',
          action_url: `/appointments`,
          metadata: { 
            date: record.appointment_date,
            title: record.title 
          },
        });
      }

      // Status changed to confirmed
      if (old_record.status !== 'confirmed' && record.status === 'confirmed') {
        await sendNotif({
          event_type: 'appointment_confirmed',
          recipients: 'custom',
          recipient_ids: recipients,
          reference_id: record.id,
          firm_id: record.firm_id,
          title: 'Appointment Confirmed',
          message: `Appointment on ${record.appointment_date} has been confirmed`,
          category: 'appointment',
          priority: 'normal',
          action_url: `/appointments`,
          metadata: { 
            date: record.appointment_date,
            title: record.title 
          },
        });
      }

      // Status changed to arrived (client has arrived)
      if (old_record.status !== 'arrived' && record.status === 'arrived') {
        // Only notify the lawyer(s), not the client
        const lawyerRecipients = [record.lawyer_id, record.created_by_user_id].filter(Boolean);
        await sendNotif({
          event_type: 'client_arrived',
          recipients: 'custom',
          recipient_ids: lawyerRecipients,
          reference_id: record.id,
          firm_id: record.firm_id,
          title: 'Client Has Arrived',
          message: `Client has arrived for their ${record.appointment_time?.slice(0, 5) || ''} appointment`,
          category: 'appointment',
          priority: 'high',
          action_url: `/appointments`,
          metadata: { 
            date: record.appointment_date,
            time: record.appointment_time,
            title: record.title,
            token_number: record.daily_serial_number
          },
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in notify-appointment-events:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
