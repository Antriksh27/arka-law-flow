import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting background batch priority update...');

    // Background task: call the single-batch RPC repeatedly until no rows left
    const backgroundTask = async () => {
      let totalUpdated = 0;
      let loops = 0;
      while (true) {
        const { data, error } = await supabaseClient.rpc('batch_update_case_priority_once', { batch_size: 200 });
        if (error) {
          console.error('RPC error during batch update:', error);
          break;
        }
        const updated = typeof data === 'number' ? data : (data?.updated_count ?? 0);
        totalUpdated += updated;
        loops += 1;
        console.log(`Batch ${loops}: updated ${updated}, total ${totalUpdated}`);
        if (!updated || updated === 0) break;
        // small pause to reduce load
        await new Promise((r) => setTimeout(r, 150));
      }
      console.log(`Background batch update complete. Total updated: ${totalUpdated}`);
    };

    // Start background task and return immediately
    // @ts-ignore - Edge runtime helper provided by Supabase
    EdgeRuntime.waitUntil(backgroundTask());

    return new Response(
      JSON.stringify({ started: true, message: 'Batch priority update started in background' }),
      { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
