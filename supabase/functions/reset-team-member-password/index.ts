import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const DEFAULT_PASSWORD = 'Hrulegal@711'

interface ResetPasswordRequest {
  user_id: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Missing environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Client scoped to the caller (JWT validation happens here)
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } },
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)

    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requesterUserId = claimsData.claims.sub

    const requestData: ResetPasswordRequest = await req.json()
    if (!requestData.user_id || !UUID_RE.test(requestData.user_id)) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Admin client for privileged DB + Auth admin API
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Authorize: requester must be an active admin in some firm
    const { data: adminMembership, error: adminMembershipError } = await supabaseAdmin
      .from('team_members')
      .select('firm_id')
      .eq('user_id', requesterUserId)
      .eq('role', 'admin')
      .eq('status', 'active')
      .maybeSingle()

    if (adminMembershipError || !adminMembership?.firm_id) {
      return new Response(
        JSON.stringify({ error: 'Only administrators can reset passwords' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Ensure target user is a member of the same firm
    const { data: targetMembership, error: targetMembershipError } = await supabaseAdmin
      .from('team_members')
      .select('id')
      .eq('user_id', requestData.user_id)
      .eq('firm_id', adminMembership.firm_id)
      .maybeSingle()

    if (targetMembershipError || !targetMembership?.id) {
      return new Response(
        JSON.stringify({ error: 'User is not a member of your firm' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
      requestData.user_id,
      { password: DEFAULT_PASSWORD }
    )

    if (resetError) {
      return new Response(
        JSON.stringify({ error: `Failed to reset password: ${resetError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error resetting password:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

