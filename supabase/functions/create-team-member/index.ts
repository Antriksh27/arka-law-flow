import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateTeamMemberRequest {
  full_name: string;
  email: string;
  phone?: string;
  role: 'lawyer' | 'paralegal' | 'junior' | 'office_staff' | 'receptionist';
  password: string;
  notes?: string;
  firm_id: string;
  invited_by: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting team member creation process')
    
    // Create Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceRoleKey,
      urlPrefix: supabaseUrl?.substring(0, 20)
    })
    
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Missing environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user is authenticated
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Only administrators can add team members' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const requestData: CreateTeamMemberRequest = await req.json()

    // Create user in Supabase Auth using admin client
    console.log('Creating user with email:', requestData.email)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: requestData.email,
      password: requestData.password,
      email_confirm: true, // Skip email verification for admin-created users
      user_metadata: {
        full_name: requestData.full_name,
        role: requestData.role,
      }
    })

    console.log('Auth user creation result:', { authUser: !!authUser, authError })

    if (authError) {
      console.error('Auth error details:', authError)
      return new Response(
        JSON.stringify({ error: `Failed to create user account: ${authError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!authUser.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create profile entry
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        full_name: requestData.full_name,
        email: requestData.email,
        phone: requestData.phone,
        role: requestData.role,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Don't throw here as it might already exist from trigger
    }

    // Add to team_members table
    const { error: teamError } = await supabaseAdmin
      .from('team_members')
      .insert({
        user_id: authUser.user.id,
        firm_id: requestData.firm_id,
        full_name: requestData.full_name,
        email: requestData.email,
        phone_number: requestData.phone,
        role: requestData.role,
        status: 'active',
        notes: requestData.notes,
        invited_by: requestData.invited_by,
      })

    if (teamError) {
      return new Response(
        JSON.stringify({ error: `Failed to add team member: ${teamError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: authUser.user,
        message: 'Team member created successfully and can now log in'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error creating team member:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})