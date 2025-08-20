-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_appointment_to_google_calendar ON appointments;

-- Create or replace the trigger function with better logic
CREATE OR REPLACE FUNCTION sync_appointment_to_google_calendar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  operation_type text;
  appointment_data jsonb;
BEGIN
  -- Determine the operation type
  IF TG_OP = 'INSERT' THEN
    operation_type := 'INSERT';
    appointment_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    operation_type := 'UPDATE';
    appointment_data := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    operation_type := 'DELETE';
    appointment_data := to_jsonb(OLD);
  END IF;

  -- Only sync if the appointment has a lawyer_id (user to sync for)
  IF (operation_type = 'DELETE' AND OLD.lawyer_id IS NOT NULL) OR 
     (operation_type IN ('INSERT', 'UPDATE') AND NEW.lawyer_id IS NOT NULL) THEN
    
    -- Add to the Google Calendar sync queue
    INSERT INTO google_calendar_sync_queue (
      user_id,
      appointment_id,
      operation,
      appointment_data,
      created_at
    ) VALUES (
      COALESCE(NEW.lawyer_id, OLD.lawyer_id),
      COALESCE(NEW.id, OLD.id),
      operation_type,
      appointment_data,
      now()
    );
    
    -- Log the sync request
    INSERT INTO audit_logs (
      entity_type,
      action,
      entity_id,
      user_id,
      details
    ) VALUES (
      'appointment',
      'google_calendar_sync_queued',
      COALESCE(NEW.id, OLD.id),
      COALESCE(NEW.lawyer_id, OLD.lawyer_id),
      jsonb_build_object(
        'operation', operation_type,
        'appointment_title', COALESCE(NEW.title, OLD.title),
        'sync_queued_at', now()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create the trigger on appointments table for all operations
CREATE TRIGGER sync_appointment_to_google_calendar
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION sync_appointment_to_google_calendar();

-- Also create a function to process the sync queue automatically
CREATE OR REPLACE FUNCTION process_google_calendar_sync_queue_auto()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  queue_item RECORD;
  sync_result json;
BEGIN
  -- Get unprocessed items from the queue (limit to avoid timeouts)
  FOR queue_item IN 
    SELECT * FROM google_calendar_sync_queue 
    WHERE processed = false 
    ORDER BY created_at ASC 
    LIMIT 5
  LOOP
    BEGIN
      -- Call the Google Calendar sync edge function
      SELECT content INTO sync_result
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
          'appointment', queue_item.appointment_data,
          'operation', queue_item.operation
        )::text
      ));
      
      -- Mark as processed
      UPDATE google_calendar_sync_queue 
      SET 
        processed = true, 
        processed_at = now(),
        sync_result = sync_result
      WHERE id = queue_item.id;
      
    EXCEPTION WHEN OTHERS THEN
      -- Mark as processed with error
      UPDATE google_calendar_sync_queue 
      SET 
        processed = true, 
        processed_at = now(),
        error_message = SQLERRM
      WHERE id = queue_item.id;
    END;
  END LOOP;
END;
$$;