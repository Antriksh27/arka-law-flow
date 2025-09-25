import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Auto-sync trigger: Processing appointments for Google Calendar sync...');

    // Get all users with auto-sync enabled and valid tokens
    const { data: autoSyncUsers, error: usersError } = await supabaseClient
      .from('google_calendar_settings')
      .select('user_id, access_token, refresh_token, calendar_id')
      .eq('sync_enabled', true)
      .eq('auto_sync', true)
      .not('access_token', 'is', null);

    if (usersError) {
      console.error('Error fetching auto-sync users:', usersError);
      throw usersError;
    }

    if (!autoSyncUsers?.length) {
      console.log('No users with auto-sync enabled');
      return new Response(
        JSON.stringify({ success: true, message: 'No users with auto-sync enabled' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Found ${autoSyncUsers.length} users with auto-sync enabled`);

    // Process queue items for each user
    let totalProcessed = 0;
    
    for (const user of autoSyncUsers) {
      try {
        // Call the queue processor for this specific user
        const { data, error } = await supabaseClient.functions.invoke('process-calendar-sync-queue', {
          body: { user_id: user.user_id }
        });

        if (error) {
          console.error(`Error processing queue for user ${user.user_id}:`, error);
        } else {
          totalProcessed += data?.processed_count || 0;
          console.log(`Processed ${data?.processed_count || 0} items for user ${user.user_id}`);
        }
      } catch (error) {
        console.error(`Failed to trigger sync for user ${user.user_id}:`, error);
      }
    }

    // Clean up old processed queue items (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { error: cleanupError } = await supabaseClient
      .from('google_calendar_sync_queue')
      .delete()
      .eq('processed', true)
      .lt('processed_at', oneHourAgo.toISOString());

    if (cleanupError) {
      console.error('Error cleaning up old queue items:', cleanupError);
    } else {
      console.log('Cleaned up old processed queue items');
    }

    console.log(`Auto-sync trigger completed: ${totalProcessed} total items processed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        users_processed: autoSyncUsers.length,
        total_items_processed: totalProcessed
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Auto-sync trigger error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});