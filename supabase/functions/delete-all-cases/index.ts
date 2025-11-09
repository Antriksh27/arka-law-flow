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
    const deletionSummary: Record<string, number> = {};

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

    // Delete in correct order to handle foreign key constraints

    // 1. Case activities
    const { error: activitiesError } = await supabaseClient
      .from('case_activities')
      .delete()
      .in('case_id', caseIds);
    if (activitiesError) console.error('Error deleting case_activities:', activitiesError);
    else {
      const { count } = await supabaseClient
        .from('case_activities')
        .select('*', { count: 'exact', head: true })
        .in('case_id', caseIds);
      deletionSummary.case_activities = count || 0;
    }

    // 2. Case assignments
    const { error: assignmentsError } = await supabaseClient
      .from('case_assignments')
      .delete()
      .in('case_id', caseIds);
    if (assignmentsError) console.error('Error deleting case_assignments:', assignmentsError);
    else deletionSummary.case_assignments = 0;

    // 3. Case contacts
    const { error: contactsError } = await supabaseClient
      .from('case_contacts')
      .delete()
      .in('case_id', caseIds);
    if (contactsError) console.error('Error deleting case_contacts:', contactsError);
    else deletionSummary.case_contacts = 0;

    // 4. Case relations
    const { error: relationsError } = await supabaseClient
      .from('case_relations')
      .delete()
      .in('case_id', caseIds);
    if (relationsError) console.error('Error deleting case_relations:', relationsError);
    else deletionSummary.case_relations = 0;

    // 5. Case internal notes
    const { error: internalNotesError } = await supabaseClient
      .from('case_internal_notes')
      .delete()
      .in('case_id', caseIds);
    if (internalNotesError) console.error('Error deleting case_internal_notes:', internalNotesError);
    else deletionSummary.case_internal_notes = 0;

    // 6. Case notes
    const { error: notesError } = await supabaseClient
      .from('case_notes')
      .delete()
      .in('case_id', caseIds);
    if (notesError) console.error('Error deleting case_notes:', notesError);
    else deletionSummary.case_notes = 0;

    // 7. Case emails
    const { error: emailsError } = await supabaseClient
      .from('case_emails')
      .delete()
      .in('case_id', caseIds);
    if (emailsError) console.error('Error deleting case_emails:', emailsError);
    else deletionSummary.case_emails = 0;

    // 8. Case documents
    const { error: documentsError } = await supabaseClient
      .from('case_documents')
      .delete()
      .in('case_id', caseIds);
    if (documentsError) console.error('Error deleting case_documents:', documentsError);
    else deletionSummary.case_documents = 0;

    // 9. Case hearings
    const { error: hearingsError } = await supabaseClient
      .from('case_hearings')
      .delete()
      .in('case_id', caseIds);
    if (hearingsError) console.error('Error deleting case_hearings:', hearingsError);
    else deletionSummary.case_hearings = 0;

    // 10. Case orders
    const { error: ordersError } = await supabaseClient
      .from('case_orders')
      .delete()
      .in('case_id', caseIds);
    if (ordersError) console.error('Error deleting case_orders:', ordersError);
    else deletionSummary.case_orders = 0;

    // 11. Case objections
    const { error: objectionsError } = await supabaseClient
      .from('case_objections')
      .delete()
      .in('case_id', caseIds);
    if (objectionsError) console.error('Error deleting case_objections:', objectionsError);
    else deletionSummary.case_objections = 0;

    // 12. Case files
    const { error: filesError } = await supabaseClient
      .from('case_files')
      .delete()
      .in('case_id', caseIds);
    if (filesError) console.error('Error deleting case_files:', filesError);
    else deletionSummary.case_files = 0;

    // 13. Case fetch queue
    const { error: queueError } = await supabaseClient
      .from('case_fetch_queue')
      .delete()
      .in('case_id', caseIds);
    if (queueError) console.error('Error deleting case_fetch_queue:', queueError);
    else deletionSummary.case_fetch_queue = 0;

    // 14. Nullify case_id in appointments, tasks, and documents (preserve them)
    await supabaseClient
      .from('appointments')
      .update({ case_id: null })
      .in('case_id', caseIds);
    
    await supabaseClient
      .from('tasks')
      .update({ case_id: null })
      .in('case_id', caseIds);

    await supabaseClient
      .from('documents')
      .update({ case_id: null })
      .in('case_id', caseIds);

    // 15. Finally, delete the cases themselves
    const { error: casesDeleteError } = await supabaseClient
      .from('cases')
      .delete()
      .eq('firm_id', firmId);
    
    if (casesDeleteError) throw casesDeleteError;
    deletionSummary.cases = caseIds.length;

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

    console.log(`Successfully deleted all cases for firm ${firmId}:`, deletionSummary);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully deleted ${caseIds.length} cases and related data`,
        summary: deletionSummary,
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
