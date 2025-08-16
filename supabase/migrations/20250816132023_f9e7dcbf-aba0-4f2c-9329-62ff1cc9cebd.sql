-- Create a function to manually process the sync queue
CREATE OR REPLACE FUNCTION public.process_sync_queue_manually(user_id_param uuid DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  queue_items RECORD;
  processed_count integer := 0;
  result json;
BEGIN
  -- Get unprocessed items for the user (or all if no user specified)
  FOR queue_items IN 
    SELECT * FROM google_calendar_sync_queue 
    WHERE processed = false 
    AND (user_id_param IS NULL OR user_id = user_id_param)
    ORDER BY created_at ASC 
    LIMIT 10
  LOOP
    -- Call the Google Calendar sync edge function
    BEGIN
      -- Mark as processed (the actual sync will be done by the edge function)
      UPDATE google_calendar_sync_queue 
      SET processed = true, processed_at = now()
      WHERE id = queue_items.id;
      
      processed_count := processed_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- Mark as processed with error
      UPDATE google_calendar_sync_queue 
      SET 
        processed = true, 
        processed_at = now(),
        error_message = SQLERRM
      WHERE id = queue_items.id;
    END;
  END LOOP;
  
  result := json_build_object(
    'success', true,
    'processed_count', processed_count,
    'message', format('Processed %s sync queue items', processed_count)
  );
  
  RETURN result;
END;
$$;