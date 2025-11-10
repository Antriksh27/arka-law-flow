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

    const batchSize = 500;
    let totalUpdated = 0;
    let hasMore = true;

    while (hasMore) {
      // Fetch a batch of cases
      const { data: cases, error: fetchError } = await supabaseClient
        .from('cases')
        .select('id')
        .neq('priority', 'medium')
        .limit(batchSize);

      if (fetchError) throw fetchError;

      if (!cases || cases.length === 0) {
        hasMore = false;
        break;
      }

      // Update this batch
      const caseIds = cases.map(c => c.id);
      const { error: updateError } = await supabaseClient
        .from('cases')
        .update({ priority: 'medium' })
        .in('id', caseIds);

      if (updateError) throw updateError;

      totalUpdated += cases.length;
      console.log(`Updated ${totalUpdated} cases so far...`);

      // If we got fewer cases than the batch size, we're done
      if (cases.length < batchSize) {
        hasMore = false;
      }
    }

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
