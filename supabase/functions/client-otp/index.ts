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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { action, phone } = await req.json();

    if (action === 'sign-in') {
      console.log('Sign-in attempt for phone:', phone);

      // Validate phone number format
      if (!phone || !phone.match(/^\+91[6-9]\d{9}$/)) {
        console.error('Invalid phone format:', phone);
        return new Response(
          JSON.stringify({ error: 'Invalid phone number format. Use +91XXXXXXXXXX' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Remove +91 prefix for database comparison
      const phoneWithoutPrefix = phone.substring(3);

      // Check if client exists with this phone and portal is enabled
      const { data: client, error: clientError } = await supabaseAdmin
        .from('clients')
        .select('id, full_name, client_portal_enabled')
        .eq('phone', phoneWithoutPrefix)
        .maybeSingle();

      if (clientError) {
        console.error('Database error checking client:', clientError);
        return new Response(
          JSON.stringify({ error: 'Database error occurred' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!client) {
        console.error('Client not found for phone:', phoneWithoutPrefix);
        return new Response(
          JSON.stringify({ error: 'No account found with this phone number' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!client.client_portal_enabled) {
        console.error('Portal not enabled for client:', client.id);
        return new Response(
          JSON.stringify({ error: 'Client portal access is not enabled for your account' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Client found:', client.id, client.full_name);

      // Check if auth user already exists
      let authUserId: string;
      
      const { data: existingClientUser } = await supabaseAdmin
        .from('client_users')
        .select('auth_user_id')
        .eq('phone', phone)
        .maybeSingle();

      if (existingClientUser?.auth_user_id) {
        console.log('Existing auth user found:', existingClientUser.auth_user_id);
        authUserId = existingClientUser.auth_user_id;
      } else {
        console.log('Creating new auth user');
        // Create a new auth user with a temporary email
        const tempEmail = `client-${phoneWithoutPrefix}@portal.temp`;
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: tempEmail,
          email_confirm: true,
          phone: phone,
          phone_confirm: true,
          user_metadata: {
            client_id: client.id,
            full_name: client.full_name,
            is_client: true
          }
        });

        if (authError || !authData.user) {
          console.error('Error creating auth user:', authError);
          return new Response(
            JSON.stringify({ error: 'Failed to create user account' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        authUserId = authData.user.id;
        console.log('New auth user created:', authUserId);
      }

      // Update client_users record
      const { error: upsertError } = await supabaseAdmin
        .from('client_users')
        .upsert({
          phone: phone,
          client_id: client.id,
          auth_user_id: authUserId,
          is_active: true,
          last_login: new Date().toISOString()
        }, {
          onConflict: 'phone'
        });

      if (upsertError) {
        console.error('Error upserting client_users:', upsertError);
      }

      // Generate a session token using admin API
      console.log('Generating session for user:', authUserId);
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
        user_id: authUserId,
      });

      if (sessionError || !sessionData) {
        console.error('Session generation error:', sessionError);
        return new Response(
          JSON.stringify({ error: 'Failed to create session' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Session created successfully');
      return new Response(
        JSON.stringify({
          success: true,
          session: sessionData.session,
          user: sessionData.user,
          client: client,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in client-otp function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
