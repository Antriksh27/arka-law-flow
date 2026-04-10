

# Fix: Edge Function "Failed to send a request" Error

## Root Cause

Two issues are causing the "Failed to send a request to the Edge Function" error:

1. **Missing CORS headers**: The `ecourts-api` edge function's `Access-Control-Allow-Headers` is missing headers that the Supabase JS client sends (`x-supabase-client-platform`, `x-supabase-client-platform-version`, `x-supabase-client-runtime`, `x-supabase-client-runtime-version`). This causes the browser's CORS preflight to fail.

2. **Preview fetch proxy interference**: The Lovable preview environment has a fetch proxy that can intercept and break POST requests to edge functions. This is a known limitation of the preview — testing on the **published URL** (https://hru-legal.lovable.app) will bypass this issue.

## Fix

**File: `supabase/functions/ecourts-api/index.ts`** — Update CORS headers to include all required Supabase client headers:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
```

This single-line change ensures the CORS preflight succeeds. After this fix:
- **Published URL** (hru-legal.lovable.app): Should work immediately
- **Preview URL**: May still fail due to the fetch proxy — this is a known Lovable preview limitation, not a code bug

