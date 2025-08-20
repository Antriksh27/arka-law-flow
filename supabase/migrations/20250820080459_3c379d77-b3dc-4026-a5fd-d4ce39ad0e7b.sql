-- Fix the auto sync trigger function with correct syntax
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
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('user_id', NEW.user_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;