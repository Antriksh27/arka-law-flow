import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create two clients: one with user auth for verification, one with service role for privileged ops
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's firm and verify admin role
    const { data: teamMember, error: teamError } = await supabaseAuth
      .from('team_members')
      .select('firm_id, role')
      .eq('user_id', user.id)
      .single();

    if (teamError || !teamMember || teamMember.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Only admins can perform this operation' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { confirmation, batch_size } = await req.json();
    
    if (confirmation !== 'DELETE_ALL_CASES') {
      return new Response(
        JSON.stringify({ error: 'Confirmation string must be "DELETE_ALL_CASES"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firmId = teamMember.firm_id;
    const batchSize = Math.min(Math.max(1, Number(batch_size) || 100), 200);

    console.log(`Starting batched case deletion for firm ${firmId} by user ${user.id} (batch_size=${batchSize})`);

    // Get one batch of case IDs for this firm
    const { data: batchCases, error: casesError } = await supabaseAdmin
      .from('cases')
      .select('id')
      .eq('firm_id', firmId)
      .limit(batchSize);

    if (casesError) throw casesError;

    const caseIds = (batchCases ?? []).map(c => c.id);

    if (caseIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          status: 'completed',
          processed: 0,
          has_more: false,
          message: 'No cases remaining to delete',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing deletion batch of ${caseIds.length} cases`);

    // Delete related data for this batch (service role bypasses RLS and speeds up)
    await Promise.all([
      supabaseAdmin.from('case_activities').delete().in('case_id', caseIds),
      supabaseAdmin.from('case_assignments').delete().in('case_id', caseIds),
      supabaseAdmin.from('case_contacts').delete().in('case_id', caseIds),
      supabaseAdmin.from('case_relations').delete().in('case_id', caseIds),
      supabaseAdmin.from('case_internal_notes').delete().in('case_id', caseIds),
      supabaseAdmin.from('case_notes').delete().in('case_id', caseIds),
      supabaseAdmin.from('case_emails').delete().in('case_id', caseIds),
      supabaseAdmin.from('case_documents').delete().in('case_id', caseIds),
      supabaseAdmin.from('case_hearings').delete().in('case_id', caseIds),
      supabaseAdmin.from('case_orders').delete().in('case_id', caseIds),
      supabaseAdmin.from('case_objections').delete().in('case_id', caseIds),
      supabaseAdmin.from('case_files').delete().in('case_id', caseIds),
      supabaseAdmin.from('case_fetch_queue').delete().in('case_id', caseIds),
    ]);

    // Nullify case_id references (preserve these records)
    await Promise.all([
      supabaseAdmin.from('appointments').update({ case_id: null }).in('case_id', caseIds),
      supabaseAdmin.from('tasks').update({ case_id: null }).in('case_id', caseIds),
      supabaseAdmin.from('documents').update({ case_id: null }).in('case_id', caseIds),
    ]);

    // Finally, delete the cases in this batch
    const { error: casesDeleteError } = await supabaseAdmin
      .from('cases')
      .delete()
      .in('id', caseIds);

    if (casesDeleteError) throw casesDeleteError;

    // Log this batch operation in audit logs
    await supabaseAdmin.from('audit_logs').insert({
      entity_type: 'cases',
      action: 'bulk_delete_batch',
      user_id: user.id,
      details: {
        firm_id: firmId,
        deleted_count: caseIds.length,
        batch_size: batchSize,
        timestamp: new Date().toISOString(),
      },
    });

    // Heuristic: if we deleted fewer than batchSize, we're likely done
    const hasMore = caseIds.length === batchSize;

    return new Response(
      JSON.stringify({
        success: true,
        status: hasMore ? 'in_progress' : 'completed',
        processed: caseIds.length,
        has_more: hasMore,
        message: hasMore ? `Deleted a batch of ${caseIds.length}. More remaining...` : `Completed deletion. Deleted final batch of ${caseIds.length}.`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in delete-all-cases function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
