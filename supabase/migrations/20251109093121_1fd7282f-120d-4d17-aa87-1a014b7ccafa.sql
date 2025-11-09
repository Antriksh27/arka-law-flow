-- Schedule the queue processor to run every 2 minutes
SELECT cron.schedule(
  'process-case-fetch-queue',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/process-fetch-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('triggered_by', 'cron', 'batch_size', 10, 'delay_ms', 1500)
  );
  $$
);