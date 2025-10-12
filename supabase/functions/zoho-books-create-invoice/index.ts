import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Get Zoho tokens
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('zoho_tokens')
      .select('*')
      .eq('firm_id', teamMember.firm_id)
      .single();

    if (tokenError || !tokenData) {
      throw new Error("Zoho not connected. Please connect Zoho Books first.");
    }

    let accessToken = tokenData.access_token;
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();

    // Refresh token if expired
    if (expiresAt <= now) {
      console.log("Access token expired, refreshing...");
      
      const zohoClientId = Deno.env.get('ZOHO_CLIENT_ID');
      const zohoClientSecret = Deno.env.get('ZOHO_CLIENT_SECRET');

      const refreshResponse = await fetch(
        "https://accounts.zoho.in/oauth/v2/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            refresh_token: tokenData.refresh_token,
            client_id: zohoClientId!,
            client_secret: zohoClientSecret!,
            grant_type: "refresh_token",
          }),
        }
      );

      if (!refreshResponse.ok) {
        const errorText = await refreshResponse.text();
        console.error("Token refresh failed:", errorText);
        throw new Error(`Token refresh failed: ${errorText}`);
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
      const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000);

      // Update token in database
      await supabaseClient
        .from('zoho_tokens')
        .update({
          access_token: accessToken,
          expires_at: newExpiresAt.toISOString(),
        })
        .eq('firm_id', teamMember.firm_id);

      console.log("Token refreshed successfully");
    }

    const organizationId = tokenData.organization_id;
    
    if (!organizationId) {
      throw new Error("Organization ID not configured");
    }

    // Get invoice data from request
    const invoiceData = await req.json();

    console.log("Creating invoice in Zoho Books...");
    
    const createResponse = await fetch(
      `https://www.zohoapis.in/books/v3/invoices?organization_id=${organizationId}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Zoho-oauthtoken ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error("Zoho Books API error:", errorText);
      throw new Error(`Zoho Books API error: ${errorText}`);
    }

    const responseData = await createResponse.json();

    console.log("Invoice created successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        invoice: responseData.invoice
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in zoho-books-create-invoice function:", error);
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