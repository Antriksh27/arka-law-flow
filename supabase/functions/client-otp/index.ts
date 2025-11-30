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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, phone } = await req.json();

    if (action === 'sign-in') {
      // Validate phone number format
      if (!phone || !phone.match(/^\+91[6-9]\d{9}$/)) {
        return new Response(
          JSON.stringify({ error: 'Invalid phone number format. Use +91XXXXXXXXXX' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if client exists with this phone and portal is enabled
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, full_name, client_portal_enabled')
        .eq('phone', phone.substring(3)) // Remove +91 prefix for comparison
        .single();

      if (clientError || !client) {
        console.error('Client not found:', clientError);
        return new Response(
          JSON.stringify({ error: 'No account found with this phone number' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!client.client_portal_enabled) {
        return new Response(
          JSON.stringify({ error: 'Client portal access is not enabled for your account' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if client_user exists, if not create auth user
      let authUserId: string;
      
      const { data: existingUser } = await supabase
        .from('client_users')
        .select('auth_user_id')
        .eq('phone', phone)
        .single();

      if (existingUser?.auth_user_id) {
        authUserId = existingUser.auth_user_id;
      } else {
        // Create a new auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          phone: phone,
          phone_confirm: true,
          user_metadata: {
            client_id: client.id,
            full_name: client.full_name
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
      }

      // Upsert client_users record
      await supabase
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

      // Create a session for the user
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: `${phone.replace('+', '')}@client.portal`,
      });

      if (sessionError) {
        console.error('Session generation error:', sessionError);
        return new Response(
          JSON.stringify({ error: 'Failed to create session' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Client signed in successfully:', phone);
      return new Response(
        JSON.stringify({
          success: true,
          session: sessionData,
          user: { id: authUserId, phone },
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
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});