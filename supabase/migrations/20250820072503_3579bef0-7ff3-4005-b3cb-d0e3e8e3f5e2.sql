-- Enable required extensions for cron HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop the existing cron job
SELECT cron.unschedule('process-google-calendar-sync-queue');

-- Create a new cron job to run every 15 seconds using pg_net
SELECT cron.schedule(
  'process-google-calendar-sync-queue',
  '*/15 * * * * *', -- Every 15 seconds
  $$
  SELECT net.http_post(
    url := 'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/process-calendar-sync-queue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY"}'::jsonb,
    body := '{"automated": true}'::jsonb
  );
  $$
);