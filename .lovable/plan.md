

## Diagnosis

The network logs confirm the root cause: the POST request to `https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/ecourts-api` returns **"Error: Failed to fetch"** -- a complete network-level failure, not an API error. This means the edge function is either **not deployed** or **crashing on startup** before it can respond.

The `ecourts-api` function code exists in the repo (`supabase/functions/ecourts-api/index.ts` + `dataMapper.ts`), and it is listed in `supabase/config.toml`, but the deployment depends on a GitHub Actions workflow that triggers only on pushes to `main`/`master`. If this workflow hasn't run successfully (missing GitHub secrets, or changes weren't pushed to the right branch), the function was never deployed to your Supabase project.

## About the MCP Link

The MCP URL (`https://mcp.ecourtsindia.com/mcp?token=...`) is a **Model Context Protocol server** -- it extends the Lovable agent's capabilities during development (letting *me* query eCourts data while building your app). However, **MCP tools cannot be called by your deployed application**. Your end users' app still needs a backend (the edge function) to call the eCourts API.

That said, the MCP link confirms you have a valid eCourtsIndia API token, which the edge function needs as `ECOURTS_API_KEY`.

## Plan

### Step 1: Verify the `ECOURTS_API_KEY` secret exists
Check that the Supabase secret `ECOURTS_API_KEY` is configured with your actual API token (the one from the MCP URL).

### Step 2: Deploy the edge function manually
Since the GitHub Actions workflow may not have run, deploy the `ecourts-api` function directly using the Supabase CLI or dashboard. This is the most likely fix -- the function code is correct but simply not deployed.

### Step 3: Verify GitHub Actions secrets
Ensure `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_ID` are set in your GitHub repo secrets so future pushes auto-deploy edge functions.

### Step 4: Test end-to-end on published URL
After deployment, test the case fetch flow on `https://hru-legal.lovable.app`.

---

### What you need to do now

1. Go to your **Supabase Dashboard** → **Edge Functions** and check if `ecourts-api` appears in the list
2. If it does NOT appear, the function was never deployed -- you'll need to deploy it (I can help prepare the command)
3. If it DOES appear but shows errors, check the function logs for startup crashes
4. Confirm that `ECOURTS_API_KEY` is set in **Supabase Dashboard → Settings → Secrets** with the token from your MCP URL

Would you like me to proceed with verifying the secrets and preparing deployment steps?

