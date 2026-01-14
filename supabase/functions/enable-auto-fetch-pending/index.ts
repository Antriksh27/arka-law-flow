import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth header for validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's firm_id and verify they're an admin
    const { data: teamMember, error: teamError } = await supabase
      .from('team_members')
      .select('firm_id, role')
      .eq('user_id', user.id)
      .single();

    if (teamError || !teamMember) {
      return new Response(JSON.stringify({ error: 'Team member not found' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (teamMember.role !== 'admin' && teamMember.role !== 'lawyer') {
      return new Response(JSON.stringify({ error: 'Only admins and lawyers can perform this action' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update all pending cases with CNRs to enable auto-fetch
    const { data: updatedCases, error: updateError } = await supabase
      .from('cases')
      .update({ cnr_auto_fetch_enabled: true })
      .eq('firm_id', teamMember.firm_id)
      .eq('status', 'pending')
      .not('cnr_number', 'is', null)
      .neq('cnr_number', '')
      .eq('cnr_auto_fetch_enabled', false)
      .select('id, case_number, cnr_number');

    if (updateError) {
      console.error('Error updating cases:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update cases', details: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Enabled auto-fetch for ${updatedCases?.length || 0} cases`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Enabled auto-fetch for ${updatedCases?.length || 0} pending cases with CNRs`,
      updatedCount: updatedCases?.length || 0,
      cases: updatedCases 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
