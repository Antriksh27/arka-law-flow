-- Set up cron job to trigger Google Calendar auto-sync every 15 seconds
-- This will automatically process the sync queue for all users with auto-sync enabled

-- First, enable the pg_cron extension if not already enabled
-- (Note: This might already be enabled in Supabase)

-- Create the cron job to call our auto-sync trigger every 15 seconds
SELECT cron.schedule(
  'google-calendar-auto-sync',
  '*/15 * * * * *', -- Every 15 seconds
  $$
  SELECT net.http_post(
    url := 'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/auto-sync-trigger',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY"}'::jsonb,
    body := '{"trigger": "auto-sync"}'::jsonb
  ) as request_id;
  $$
);

-- Also schedule cleanup of old queue items every hour
SELECT cron.schedule(
  'google-calendar-cleanup',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT public.cleanup_old_sync_queue_items();
  $$
);