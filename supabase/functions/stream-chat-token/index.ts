import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createHmac } from "https://deno.land/std@0.190.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STREAM_API_KEY = "fvtnet5pupyf";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid auth token');
    }

    console.log('Generating Stream Chat token for user:', user.id);

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const streamApiSecret = Deno.env.get('STREAM_API_SECRET');
    if (!streamApiSecret) {
      throw new Error('STREAM_API_SECRET not configured');
    }

    // Generate Stream Chat token
    const userId = user.id;
    
    // Helper function to create base64url encoding
    const base64UrlEncode = (str: string): string => {
      return btoa(str)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
    };
    
    const header = {
      alg: "HS256",
      typ: "JWT"
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      user_id: userId,
      iat: now,
      exp: now + (60 * 60 * 24 * 7) // 7 days
    };

    const base64Header = base64UrlEncode(JSON.stringify(header));
    const base64Payload = base64UrlEncode(JSON.stringify(payload));
    const signature = createHmac("sha256", streamApiSecret)
      .update(`${base64Header}.${base64Payload}`)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    const token = `${base64Header}.${base64Payload}.${signature}`;
    
    console.log('Stream Chat token generated successfully for user:', userId);

    console.log('Stream Chat token generated successfully');

    return new Response(
      JSON.stringify({
        token,
        user_id: userId,
        user_name: profile?.full_name || user.email?.split('@')[0] || 'User',
        api_key: STREAM_API_KEY
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in stream-chat-token function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});
