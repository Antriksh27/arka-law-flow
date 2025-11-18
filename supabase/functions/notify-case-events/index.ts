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
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const functionUrl = Deno.env.get('SUPABASE_URL') + '/functions/v1/send-smart-notification';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Helper to send notification
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

    // Case created
    if (type === 'INSERT') {
      await sendNotif({
        event_type: 'case_created',
        recipients: 'team',
        firm_id: record.firm_id,
        reference_id: record.id,
        case_id: record.id,
        title: 'New Case Created',
        message: `Case "${record.case_title}" has been created`,
        category: 'case',
        priority: 'normal',
        action_url: `/cases/${record.id}`,
        metadata: { case_title: record.case_title },
      });
    }

    // Case updated
    if (type === 'UPDATE') {
      // Status changed
      if (old_record.status !== record.status) {
        await sendNotif({
          event_type: 'case_status_changed',
          recipients: 'case_members',
          case_id: record.id,
          reference_id: record.id,
          title: 'Case Status Updated',
          message: `Case "${record.case_title}" status changed to ${record.status}`,
          category: 'case',
          priority: 'normal',
          action_url: `/cases/${record.id}`,
          metadata: { old_status: old_record.status, new_status: record.status },
        });
      }

      // Assignment changed
      if (old_record.assigned_to !== record.assigned_to || 
          JSON.stringify(old_record.assigned_users) !== JSON.stringify(record.assigned_users)) {
        
        const newAssignees = [
          record.assigned_to,
          ...(record.assigned_users || [])
        ].filter((id, index, self) => id && self.indexOf(id) === index);

        await sendNotif({
          event_type: 'case_assigned',
          recipients: 'custom',
          recipient_ids: newAssignees,
          reference_id: record.id,
          case_id: record.id,
          title: 'Case Assigned to You',
          message: `You have been assigned to case "${record.case_title}"`,
          category: 'case',
          priority: 'high',
          action_url: `/cases/${record.id}`,
          metadata: { case_title: record.case_title },
        });
      }

      // Next hearing approaching (within 24 hours)
      if (record.next_hearing_date) {
        const nextHearing = new Date(record.next_hearing_date);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);

        if (nextHearing <= tomorrow && nextHearing > new Date()) {
          await sendNotif({
            event_type: 'case_deadline_approaching',
            recipients: 'case_members',
            case_id: record.id,
            reference_id: record.id,
            title: 'Hearing Tomorrow',
            message: `Case "${record.case_title}" has a hearing scheduled tomorrow`,
            category: 'hearing',
            priority: 'urgent',
            action_url: `/cases/${record.id}`,
            metadata: { hearing_date: record.next_hearing_date },
          });
        }
      }

      // Case disposed
      if (record.status === 'disposed' && old_record.status !== 'disposed') {
        await sendNotif({
          event_type: 'case_disposed',
          recipients: 'case_members',
          case_id: record.id,
          reference_id: record.id,
          title: 'Case Disposed',
          message: `Case "${record.case_title}" has been disposed`,
          category: 'case',
          priority: 'high',
          action_url: `/cases/${record.id}`,
          metadata: { disposal_date: record.disposal_date },
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in notify-case-events:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
