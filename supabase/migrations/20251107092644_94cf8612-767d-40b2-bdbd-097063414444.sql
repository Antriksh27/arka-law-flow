-- Ensure pg_net extension is enabled in the extensions schema
-- This is required for http_post function used in notification triggers
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Grant usage permissions
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;