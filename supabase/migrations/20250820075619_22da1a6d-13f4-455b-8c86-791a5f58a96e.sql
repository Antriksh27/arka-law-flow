-- Fix ambiguous column reference in sync_appointment_to_google_calendar function
CREATE OR REPLACE FUNCTION public.sync_appointment_to_google_calendar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    -- Fix: Explicitly qualify the appointment_data column with table name
    SELECT gcsq.id INTO existing_queue_item_id
    FROM public.google_calendar_sync_queue gcsq
    WHERE gcsq.user_id = COALESCE(NEW.lawyer_id, OLD.lawyer_id)
      AND gcsq.appointment_data->>'id' = COALESCE(NEW.id::text, OLD.id::text)
      AND gcsq.operation = operation_type
      AND gcsq.processed = false
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
$$;