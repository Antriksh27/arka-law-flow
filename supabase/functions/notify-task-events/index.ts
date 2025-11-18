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

    // Task created/assigned
    if (type === 'INSERT' && record.assigned_to) {
      await sendNotif({
        event_type: 'task_assigned',
        recipients: 'single',
        recipient_ids: [record.assigned_to],
        reference_id: record.id,
        case_id: record.case_id,
        title: 'Task Assigned to You',
        message: `New task: "${record.title}"`,
        category: 'task',
        priority: record.priority === 'urgent' ? 'urgent' : 'normal',
        action_url: record.case_id ? `/cases/${record.case_id}` : `/tasks`,
        metadata: { 
          task_title: record.title,
          due_date: record.due_date 
        },
      });
    }

    // Task updated
    if (type === 'UPDATE') {
      // Reassigned
      if (old_record.assigned_to !== record.assigned_to && record.assigned_to) {
        await sendNotif({
          event_type: 'task_reassigned',
          recipients: 'single',
          recipient_ids: [record.assigned_to],
          reference_id: record.id,
          case_id: record.case_id,
          title: 'Task Reassigned to You',
          message: `Task "${record.title}" has been reassigned to you`,
          category: 'task',
          priority: record.priority === 'urgent' ? 'urgent' : 'high',
          action_url: record.case_id ? `/cases/${record.case_id}` : `/tasks`,
          metadata: { task_title: record.title },
        });
      }

      // Status changed to completed
      if (old_record.status !== 'completed' && record.status === 'completed') {
        await sendNotif({
          event_type: 'task_completed',
          recipients: 'single',
          recipient_ids: [record.created_by],
          reference_id: record.id,
          case_id: record.case_id,
          title: 'Task Completed',
          message: `Task "${record.title}" has been marked as completed`,
          category: 'task',
          priority: 'low',
          action_url: record.case_id ? `/cases/${record.case_id}` : `/tasks`,
          metadata: { task_title: record.title, completed_by: record.assigned_to },
        });
      }

      // Priority changed to urgent
      if (old_record.priority !== 'urgent' && record.priority === 'urgent') {
        await sendNotif({
          event_type: 'task_priority_changed',
          recipients: 'single',
          recipient_ids: [record.assigned_to],
          reference_id: record.id,
          case_id: record.case_id,
          title: 'Task Priority Updated',
          message: `Task "${record.title}" is now marked as URGENT`,
          category: 'task',
          priority: 'urgent',
          action_url: record.case_id ? `/cases/${record.case_id}` : `/tasks`,
          metadata: { task_title: record.title, new_priority: 'urgent' },
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in notify-task-events:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
