-- Enable automatic processing of Google Calendar sync queue
-- Create a trigger to automatically process sync queue items

-- First, let's update the process function to be more robust
CREATE OR REPLACE FUNCTION public.process_google_calendar_sync_queue_auto()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  queue_item RECORD;
  http_response json;
BEGIN
  -- Get unprocessed items from the queue (limit to avoid timeouts)
  FOR queue_item IN 
    SELECT * FROM google_calendar_sync_queue 
    WHERE processed = false 
    ORDER BY created_at ASC 
    LIMIT 5
  LOOP
    BEGIN
      -- Call the Google Calendar sync edge function using the invoke method
      SELECT content INTO http_response
      FROM http((
        'POST',
        'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/google-calendar-sync',
        ARRAY[
          http_header('Content-Type', 'application/json'),
          http_header('Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'token')
        ],
        'application/json',
        jsonb_build_object(
          'action', 'auto_sync',
          'user_id', queue_item.user_id,
          'appointment_data', queue_item.appointment_data,
          'operation', queue_item.operation
        )::text
      ));
      
      -- Mark as processed
      UPDATE google_calendar_sync_queue 
      SET 
        processed = true, 
        processed_at = now()
      WHERE id = queue_item.id;
      
      RAISE LOG 'Successfully processed sync queue item % for user %', 
        queue_item.id, queue_item.user_id;
      
    EXCEPTION WHEN OTHERS THEN
      -- Mark as processed with error
      UPDATE google_calendar_sync_queue 
      SET 
        processed = true, 
        processed_at = now(),
        error_message = SQLERRM
      WHERE id = queue_item.id;
      
      RAISE LOG 'Error processing sync queue item %: %', 
        queue_item.id, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- Create a function that can be called via webhook or cron to process queue
CREATE OR REPLACE FUNCTION public.trigger_sync_queue_processing()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  processed_count integer := 0;
BEGIN
  -- Process the queue
  PERFORM public.process_google_calendar_sync_queue_auto();
  
  -- Count how many were processed
  SELECT COUNT(*) INTO processed_count
  FROM google_calendar_sync_queue
  WHERE processed_at > now() - interval '1 minute';
  
  RETURN json_build_object(
    'success', true,
    'message', 'Sync queue processing triggered',
    'recently_processed', processed_count
  );
END;
$$;