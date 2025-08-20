-- Fix the function search path security issues by adding SET search_path = ''
CREATE OR REPLACE FUNCTION sync_appointment_to_google_calendar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  operation_type text;
  appointment_data jsonb;
  existing_queue_item_id uuid;
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
    
    -- Check for existing unprocessed queue item for this appointment and operation
    SELECT id INTO existing_queue_item_id
    FROM public.google_calendar_sync_queue 
    WHERE user_id = COALESCE(NEW.lawyer_id, OLD.lawyer_id)
      AND appointment_data->>'id' = COALESCE(NEW.id::text, OLD.id::text)
      AND operation = operation_type
      AND processed = false
    LIMIT 1;
    
    -- Only add to queue if no existing unprocessed item found
    IF existing_queue_item_id IS NULL THEN
      -- Add to the Google Calendar sync queue
      INSERT INTO public.google_calendar_sync_queue (
        user_id,
        appointment_id,
        appointment_data,
        operation,
        created_at
      ) VALUES (
        COALESCE(NEW.lawyer_id, OLD.lawyer_id),
        COALESCE(NEW.id, OLD.id),
        appointment_data,
        operation_type,
        NOW()
      );
      
      RAISE LOG 'Added appointment % to Google Calendar sync queue with operation %', 
        COALESCE(NEW.id, OLD.id), operation_type;
    ELSE
      RAISE LOG 'Skipped duplicate sync queue entry for appointment % with operation %', 
        COALESCE(NEW.id, OLD.id), operation_type;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Update the cleanup function with proper search path
CREATE OR REPLACE FUNCTION cleanup_old_sync_queue_items()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Delete processed items older than 24 hours
  DELETE FROM public.google_calendar_sync_queue 
  WHERE processed = true 
    AND processed_at < NOW() - INTERVAL '24 hours';
    
  -- Delete failed items with more than 5 retries that are older than 1 hour
  DELETE FROM public.google_calendar_sync_queue 
  WHERE processed = false 
    AND retry_count > 5 
    AND created_at < NOW() - INTERVAL '1 hour';
    
  RAISE LOG 'Cleaned up old Google Calendar sync queue items';
END;
$function$;