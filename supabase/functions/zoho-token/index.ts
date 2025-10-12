import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();

    if (!code) {
      throw new Error("Authorization code is required");
    }

    const zohoClientId = Deno.env.get('ZOHO_CLIENT_ID');
    const zohoClientSecret = Deno.env.get('ZOHO_CLIENT_SECRET');
    const zohoRedirectUri = Deno.env.get('ZOHO_REDIRECT_URI');

    if (!zohoClientId || !zohoClientSecret || !zohoRedirectUri) {
      throw new Error("Zoho credentials not configured");
    }

    console.log("Exchanging Zoho authorization code for tokens...");

    // Exchange authorization code for access token
    const tokenResponse = await fetch(
      "https://accounts.zoho.in/oauth/v2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: zohoClientId,
          client_secret: zohoClientSecret,
          redirect_uri: zohoRedirectUri,
          code: code,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Zoho token exchange failed:", errorText);
      throw new Error(`Zoho token exchange failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();

    console.log('Zoho token response:', JSON.stringify(tokenData));

    // Check if we got an error from Zoho
    if (tokenData.error) {
      console.error("Zoho API error:", tokenData);
      throw new Error(tokenData.error_description || tokenData.error || "Zoho authentication failed");
    }

    // Validate we have required tokens
    if (!tokenData.access_token) {
      console.error("No access token in response:", tokenData);
      throw new Error("No access token received from Zoho");
    }

    // Calculate expiry time with validation
    const expiresInSeconds = typeof tokenData.expires_in === 'number' && tokenData.expires_in > 0
      ? tokenData.expires_in 
      : 3600; // Default to 1 hour if missing or invalid
    
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error("Failed to get user");
    }

    // Get user's firm_id
    const { data: teamMember, error: teamError } = await supabaseClient
      .from('team_members')
      .select('firm_id')
      .eq('user_id', user.id)
      .single();

    if (teamError || !teamMember) {
      throw new Error("Failed to get user's firm");
    }

    // Fetch existing token (to preserve refresh_token if Zoho doesn't resend it)
    const { data: existingToken } = await supabaseClient
      .from('zoho_tokens')
      .select('refresh_token')
      .eq('firm_id', teamMember.firm_id)
      .maybeSingle();

    const refreshTokenToStore = tokenData.refresh_token || existingToken?.refresh_token;

    // Store tokens in database (upsert)
    const { error: insertError } = await supabaseClient
      .from('zoho_tokens')
      .upsert({
        firm_id: teamMember.firm_id,
        user_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: refreshTokenToStore,
        expires_at: expiresAt.toISOString(),
      }, {
        onConflict: 'firm_id',
      });

    if (insertError) {
      console.error("Failed to store tokens:", insertError);
      throw new Error("Failed to store tokens");
    }

    console.log("Zoho tokens stored successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Zoho connected successfully"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in zoho-token function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});