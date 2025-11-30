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

    const { action, phone, token } = await req.json();

    if (action === 'send-otp') {
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

      // Send OTP using Supabase Auth
      const { data: otpData, error: otpError } = await supabase.auth.signInWithOtp({
        phone: phone,
      });

      if (otpError) {
        console.error('OTP send error:', otpError);
        return new Response(
          JSON.stringify({ error: 'Failed to send OTP. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('OTP sent successfully to:', phone);
      return new Response(
        JSON.stringify({ success: true, message: 'OTP sent successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify-otp') {
      // Verify OTP
      const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
        phone: phone,
        token: token,
        type: 'sms',
      });

      if (verifyError || !authData.user) {
        console.error('OTP verification error:', verifyError);
        return new Response(
          JSON.stringify({ error: 'Invalid OTP. Please try again.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get client data
      const { data: client } = await supabase
        .from('clients')
        .select('id, full_name')
        .eq('phone', phone.substring(3))
        .single();

      if (!client) {
        return new Response(
          JSON.stringify({ error: 'Client data not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create or update client_users record
      const { error: upsertError } = await supabase
        .from('client_users')
        .upsert({
          client_id: client.id,
          phone: phone,
          auth_user_id: authData.user.id,
          is_active: true,
          last_login: new Date().toISOString(),
        }, {
          onConflict: 'phone'
        });

      if (upsertError) {
        console.error('Error updating client_users:', upsertError);
      }

      console.log('Client logged in successfully:', phone);
      return new Response(
        JSON.stringify({
          success: true,
          session: authData.session,
          user: authData.user,
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