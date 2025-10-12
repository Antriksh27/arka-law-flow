import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STREAM_API_KEY = "fvtnet5pupyf";

serve(async (req) => {
  // Handle CORS preflight
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
      console.error('Missing Authorization header');
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Validate user from the access token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('Invalid auth token', userError);
      return new Response(JSON.stringify({ error: 'Invalid auth token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Generating Stream Chat token for user:', user.id);

    // Fetch profile data for nicer display names
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const streamApiSecret = Deno.env.get('STREAM_API_SECRET');
    if (!streamApiSecret) {
      console.error('STREAM_API_SECRET not configured');
      return new Response(JSON.stringify({ error: 'STREAM_API_SECRET not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Build a JWT for Stream Chat using HS256
    const userId = user.id;

    const base64UrlEncode = (input: string) => {
      return btoa(input)
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    };

    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      user_id: userId,
      iat: now,
      exp: now + 60 * 60 * 24 * 7, // 7 days
    };

    const base64Header = base64UrlEncode(JSON.stringify(header));
    const base64Payload = base64UrlEncode(JSON.stringify(payload));
    
    // Use Web Crypto API for HMAC signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(streamApiSecret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureData = encoder.encode(`${base64Header}.${base64Payload}`);
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, signatureData);
    const signatureArray = new Uint8Array(signatureBuffer);
    
    // Convert to base64url
    let signature = btoa(String.fromCharCode(...signatureArray))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const token = `${base64Header}.${base64Payload}.${signature}`;

    console.log('Stream Chat token generated successfully for user:', userId);

    const responseBody = {
      token,
      user_id: userId,
      user_name: profile?.full_name || user.email?.split('@')[0] || 'User',
      email: profile?.email || user.email || null,
      api_key: STREAM_API_KEY,
      status: 'ok'
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in stream-chat-token function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});