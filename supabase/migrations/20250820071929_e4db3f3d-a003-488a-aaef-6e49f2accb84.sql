-- Drop the existing cron job
SELECT cron.unschedule('process-google-calendar-sync-queue');

-- Create a new cron job to run every 15 seconds
SELECT cron.schedule(
  'process-google-calendar-sync-queue',
  '*/15 * * * * *', -- Every 15 seconds (note the 6 field format for seconds)
  $$
  SELECT content FROM http((
    'POST',
    'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/process-calendar-sync-queue',
    ARRAY[http_header('Content-Type', 'application/json')],
    'application/json',
    '{"automated": true}'
  ));
  $$
);