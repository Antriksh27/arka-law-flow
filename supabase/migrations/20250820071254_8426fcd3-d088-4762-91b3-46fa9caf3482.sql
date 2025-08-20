-- Create a cron job to automatically process Google Calendar sync queue every 5 minutes
SELECT cron.schedule(
  'process-google-calendar-sync-queue',
  '*/5 * * * *', -- Every 5 minutes
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