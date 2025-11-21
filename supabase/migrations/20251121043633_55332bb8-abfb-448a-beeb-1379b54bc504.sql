-- Create cron job to process fetch queue every 2 minutes (for retries)
SELECT cron.schedule(
  'process-fetch-queue-every-2-min',
  '*/2 * * * *', -- Every 2 minutes
  $$
  SELECT
    net.http_post(
        url:='https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/process-fetch-queue',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY"}'::jsonb,
        body:='{"batch_size": 10, "delay_ms": 2000}'::jsonb
    ) as request_id;
  $$
);