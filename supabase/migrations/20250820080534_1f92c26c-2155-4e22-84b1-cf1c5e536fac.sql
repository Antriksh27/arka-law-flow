-- Fix the auto-sync system by removing problematic functions and using proper HTTP calls

-- First, remove the problematic functions that use non-existent http_header function
DROP FUNCTION IF EXISTS public.process_google_calendar_sync_queue_auto();

-- Remove the cron job with wrong settings
SELECT cron.unschedule('process-google-calendar-sync-queue');

-- Remove the problematic trigger
DROP TRIGGER IF EXISTS auto_process_sync_queue ON google_calendar_sync_queue;
DROP FUNCTION IF EXISTS public.auto_process_sync_queue_trigger();

-- Create a simpler and working approach: just process the queue using edge functions
-- The edge functions already work perfectly, so let's use a cron job that calls them directly

-- Create a new cron job that properly calls the existing auto-sync-trigger edge function
SELECT cron.schedule(
  'google-calendar-auto-sync',
  '*/2 * * * *', -- Every 2 minutes for better responsiveness
  $$
  SELECT net.http_post(
    url := 'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/auto-sync-trigger',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  );
  $$
);

-- Also create a trigger that calls the edge function when new items are added
CREATE OR REPLACE FUNCTION public.trigger_calendar_sync_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Call the auto-sync-trigger edge function asynchronously
  PERFORM net.http_post(
    url := 'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/auto-sync-trigger',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('triggered_by', 'insert', 'user_id', NEW.user_id)
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on insert to google_calendar_sync_queue
CREATE TRIGGER trigger_calendar_sync_on_queue_insert
  AFTER INSERT ON google_calendar_sync_queue
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calendar_sync_on_insert();