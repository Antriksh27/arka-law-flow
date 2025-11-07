-- Fix pg_net installation: ensure functions are available as net.http_post
DO $$ BEGIN
  -- Drop wrongly-installed extension to reset schema
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    DROP EXTENSION pg_net CASCADE;
  END IF;
END $$;

-- Install pg_net with its default schema (net)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Ensure permissions on the net schema so triggers can call it
GRANT USAGE ON SCHEMA net TO authenticated;
GRANT USAGE ON SCHEMA net TO service_role;