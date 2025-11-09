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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's firm and verify admin role
    const { data: teamMember, error: teamError } = await supabaseClient
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

    const { confirmation } = await req.json();
    
    if (confirmation !== 'DELETE_ALL_CASES') {
      return new Response(
        JSON.stringify({ error: 'Confirmation string must be "DELETE_ALL_CASES"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firmId = teamMember.firm_id;

    console.log(`Starting case deletion for firm ${firmId} by user ${user.id}`);

    // Get all case IDs for this firm
    const { data: cases, error: casesError } = await supabaseClient
      .from('cases')
      .select('id')
      .eq('firm_id', firmId);

    if (casesError) throw casesError;
    
    const caseIds = cases?.map(c => c.id) || [];
    console.log(`Found ${caseIds.length} cases to delete`);

    if (caseIds.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No cases found to delete', summary: {} }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process deletion in background to avoid timeout
    const deletionTask = async () => {
      const deletionSummary: Record<string, number> = {};
      
      try {
        console.log(`Background deletion started for ${caseIds.length} cases`);
        
        // Process in batches of 100 to avoid overwhelming the database
        const batchSize = 100;
        for (let i = 0; i < caseIds.length; i += batchSize) {
          const batch = caseIds.slice(i, i + batchSize);
          console.log(`Processing batch ${i / batchSize + 1}, cases ${i + 1}-${Math.min(i + batchSize, caseIds.length)}`);
          
          // Delete related data for this batch
          await Promise.all([
            supabaseClient.from('case_activities').delete().in('case_id', batch),
            supabaseClient.from('case_assignments').delete().in('case_id', batch),
            supabaseClient.from('case_contacts').delete().in('case_id', batch),
            supabaseClient.from('case_relations').delete().in('case_id', batch),
            supabaseClient.from('case_internal_notes').delete().in('case_id', batch),
            supabaseClient.from('case_notes').delete().in('case_id', batch),
            supabaseClient.from('case_emails').delete().in('case_id', batch),
            supabaseClient.from('case_documents').delete().in('case_id', batch),
            supabaseClient.from('case_hearings').delete().in('case_id', batch),
            supabaseClient.from('case_orders').delete().in('case_id', batch),
            supabaseClient.from('case_objections').delete().in('case_id', batch),
            supabaseClient.from('case_files').delete().in('case_id', batch),
            supabaseClient.from('case_fetch_queue').delete().in('case_id', batch),
          ]);
          
          // Nullify case_id references (preserve these records)
          await Promise.all([
            supabaseClient.from('appointments').update({ case_id: null }).in('case_id', batch),
            supabaseClient.from('tasks').update({ case_id: null }).in('case_id', batch),
            supabaseClient.from('documents').update({ case_id: null }).in('case_id', batch),
          ]);
          
          console.log(`Batch ${i / batchSize + 1} related data deleted`);
        }
        
        // Finally, delete all cases at once
        console.log(`Deleting ${caseIds.length} cases from main table`);
        const { error: casesDeleteError } = await supabaseClient
          .from('cases')
          .delete()
          .eq('firm_id', firmId);
        
        if (casesDeleteError) {
          console.error('Error deleting cases:', casesDeleteError);
          throw casesDeleteError;
        }
        
        deletionSummary.cases = caseIds.length;
        deletionSummary.total_batches = Math.ceil(caseIds.length / batchSize);
        
        // Log this operation in audit logs
        await supabaseClient.from('audit_logs').insert({
          entity_type: 'cases',
          action: 'bulk_delete_all',
          user_id: user.id,
          details: {
            firm_id: firmId,
            deleted_count: caseIds.length,
            summary: deletionSummary,
            timestamp: new Date().toISOString(),
          },
        });
        
        console.log(`Successfully deleted all ${caseIds.length} cases for firm ${firmId}`);
      } catch (error) {
        console.error('Error in background deletion task:', error);
        
        // Log the error
        await supabaseClient.from('audit_logs').insert({
          entity_type: 'cases',
          action: 'bulk_delete_failed',
          user_id: user.id,
          details: {
            firm_id: firmId,
            error: error.message,
            timestamp: new Date().toISOString(),
          },
        });
      }
    };

    // Start background task
    // @ts-ignore - EdgeRuntime is available in Deno Deploy
    if (typeof EdgeRuntime !== 'undefined') {
      // @ts-ignore
      EdgeRuntime.waitUntil(deletionTask());
    } else {
      // Fallback for local development - run immediately but don't await
      deletionTask();
    }

    // Return immediate response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Deletion of ${caseIds.length} cases has been started in the background`,
        total_cases: caseIds.length,
        status: 'processing',
      }),
      { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in delete-all-cases function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
