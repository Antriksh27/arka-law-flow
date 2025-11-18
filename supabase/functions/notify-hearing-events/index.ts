import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

    // Hearing created
    if (type === 'INSERT') {
      await sendNotif({
        event_type: 'hearing_scheduled',
        recipients: 'case_members',
        case_id: record.case_id,
        reference_id: record.id,
        firm_id: record.firm_id,
        title: 'Hearing Scheduled',
        message: `A hearing has been scheduled for ${record.hearing_date}`,
        category: 'hearing',
        priority: 'high',
        action_url: `/cases/${record.case_id}`,
        metadata: { 
          hearing_date: record.hearing_date,
          hearing_time: record.hearing_time,
          court_name: record.court_name 
        },
      });
    }

    // Hearing updated
    if (type === 'UPDATE') {
      // Date/time changed
      if (old_record.hearing_date !== record.hearing_date || 
          old_record.hearing_time !== record.hearing_time) {
        await sendNotif({
          event_type: 'hearing_updated',
          recipients: 'case_members',
          case_id: record.case_id,
          reference_id: record.id,
          firm_id: record.firm_id,
          title: 'Hearing Rescheduled',
          message: `Hearing rescheduled to ${record.hearing_date}`,
          category: 'hearing',
          priority: 'urgent',
          action_url: `/cases/${record.case_id}`,
          metadata: { 
            old_date: old_record.hearing_date,
            new_date: record.hearing_date 
          },
        });
      }

      // Outcome recorded
      if (!old_record.outcome && record.outcome) {
        await sendNotif({
          event_type: 'hearing_outcome_recorded',
          recipients: 'case_members',
          case_id: record.case_id,
          reference_id: record.id,
          firm_id: record.firm_id,
          title: 'Hearing Outcome Recorded',
          message: `Outcome recorded for hearing on ${record.hearing_date}`,
          category: 'hearing',
          priority: 'normal',
          action_url: `/cases/${record.case_id}`,
          metadata: { outcome: record.outcome },
        });
      }

      // Next hearing set
      if (!old_record.next_hearing_date && record.next_hearing_date) {
        await sendNotif({
          event_type: 'next_hearing_set',
          recipients: 'case_members',
          case_id: record.case_id,
          reference_id: record.id,
          firm_id: record.firm_id,
          title: 'Next Hearing Scheduled',
          message: `Next hearing scheduled for ${record.next_hearing_date}`,
          category: 'hearing',
          priority: 'high',
          action_url: `/cases/${record.case_id}`,
          metadata: { next_hearing_date: record.next_hearing_date },
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in notify-hearing-events:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
