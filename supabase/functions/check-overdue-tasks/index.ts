import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[check-overdue-tasks] Starting overdue task check...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString().split('T')[0];
    
    // Find all overdue tasks that haven't been notified today
    const { data: overdueTasks, error } = await supabase
      .from('tasks')
      .select('id, title, assigned_to, due_date, last_notified_at, priority')
      .lt('due_date', todayISO)
      .neq('status', 'completed')
      .or(`last_notified_at.is.null,last_notified_at.lt.${todayISO}`);
    
    if (error) throw error;
    
    console.log(`[check-overdue-tasks] Found ${overdueTasks?.length || 0} overdue tasks`);
    
    // Send notifications for each overdue task
    let notifiedCount = 0;
    for (const task of overdueTasks || []) {
      if (task.assigned_to) {
        try {
          // Call notify-task function
          const notifyResponse = await supabase.functions.invoke('notify-task', {
            body: {
              taskId: task.id,
              action: 'overdue',
              recipientId: task.assigned_to,
              data: {
                dueDate: task.due_date,
                daysOverdue: Math.floor((today.getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24))
              },
            },
          });
          
          if (notifyResponse.error) {
            console.error(`[check-overdue-tasks] Failed to notify for task ${task.id}:`, notifyResponse.error);
            continue;
          }
          
          // Update last_notified_at
          await supabase
            .from('tasks')
            .update({ last_notified_at: new Date().toISOString() })
            .eq('id', task.id);
          
          notifiedCount++;
        } catch (err) {
          console.error(`[check-overdue-tasks] Error processing task ${task.id}:`, err);
        }
      }
    }
    
    console.log(`[check-overdue-tasks] Sent ${notifiedCount} notifications`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        checked: overdueTasks?.length || 0,
        notified: notifiedCount 
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[check-overdue-tasks] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
