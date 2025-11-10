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

    console.log('Starting batch priority update using database function...');

    // Call the database function that handles batching efficiently
    const { data, error } = await supabaseClient
      .rpc('batch_update_case_priority', {
        target_priority: 'medium',
        batch_size: 1000
      });

    if (error) {
      console.error('Database function error:', error);
      throw error;
    }

    const totalUpdated = data?.[0]?.updated_count || 0;
    console.log(`Successfully updated ${totalUpdated} cases to medium priority`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalUpdated,
        message: `Successfully updated ${totalUpdated} cases to medium priority` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
