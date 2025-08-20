-- Create a function to automatically process sync queue when items are added
CREATE OR REPLACE FUNCTION public.auto_process_sync_queue_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only process if this is a new unprocessed item
  IF NEW.processed = false THEN
    -- Call the edge function to process the queue (async)
    PERFORM net.http_post(
      url := 'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/process-calendar-sync-queue',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('user_id', NEW.user_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on google_calendar_sync_queue
DROP TRIGGER IF EXISTS auto_process_sync_queue ON google_calendar_sync_queue;
CREATE TRIGGER auto_process_sync_queue
  AFTER INSERT ON google_calendar_sync_queue
  FOR EACH ROW
  EXECUTE FUNCTION auto_process_sync_queue_trigger();

-- Also create a cron job for periodic processing (every 5 minutes)
SELECT cron.schedule(
  'process-google-calendar-sync-queue',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/auto-sync-trigger',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('scheduled', true)
  );
  $$
);