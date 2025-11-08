import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const KNOCK_API_KEY = Deno.env.get('KNOCK_API_KEY');
const KNOCK_API_URL = 'https://api.knock.app/v1';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskId, action, recipientId, data } = await req.json();
    
    console.log(`[notify-task] Processing notification for task ${taskId}, action: ${action}`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Fetch task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_user:profiles!tasks_assigned_to_fkey(full_name, id),
        assigned_by_user:profiles!tasks_assigned_by_fkey(full_name),
        case:cases(case_title),
        client:clients(full_name)
      `)
      .eq('id', taskId)
      .single();
    
    if (taskError) throw taskError;
    
    // Determine workflow key based on action
    const workflowKey = `task-${action}`;
    
    // Send notification via Knock
    const knockResponse = await fetch(`${KNOCK_API_URL}/workflows/${workflowKey}/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KNOCK_API_KEY}`,
      },
      body: JSON.stringify({
        recipients: [{ id: recipientId, email: recipientId }],
        data: {
          taskId: task.id,
          taskTitle: task.title,
          taskPriority: task.priority,
          taskDueDate: task.due_date,
          caseTitle: task.case?.case_title || null,
          clientName: task.client?.full_name || null,
          assignedBy: task.assigned_by_user?.full_name || 'System',
          ...data,
        },
      }),
    });
    
    if (!knockResponse.ok) {
      const errorText = await knockResponse.text();
      console.error('[notify-task] Knock API error:', errorText);
      throw new Error(`Knock API failed: ${errorText}`);
    }
    
    console.log(`[notify-task] Successfully sent ${action} notification for task ${taskId}`);
    
    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent' }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[notify-task] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
