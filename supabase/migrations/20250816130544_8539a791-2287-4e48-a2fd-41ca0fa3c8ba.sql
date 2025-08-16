-- Function to trigger Google Calendar sync via edge function
CREATE OR REPLACE FUNCTION sync_appointment_to_google_calendar()
RETURNS TRIGGER AS $$
DECLARE
  sync_result RECORD;
BEGIN
  -- Only sync if the appointment has a lawyer_id (user to sync for)
  IF (TG_OP = 'DELETE' AND OLD.lawyer_id IS NOT NULL) OR 
     (TG_OP IN ('INSERT', 'UPDATE') AND NEW.lawyer_id IS NOT NULL) THEN
    
    -- Call the Google Calendar sync edge function
    -- We'll use a background task approach since we can't directly call edge functions from triggers
    INSERT INTO google_calendar_sync_queue (
      user_id,
      appointment_id,
      operation,
      appointment_data,
      created_at
    ) VALUES (
      COALESCE(NEW.lawyer_id, OLD.lawyer_id),
      COALESCE(NEW.id, OLD.id),
      TG_OP,
      CASE 
        WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
        ELSE to_jsonb(NEW)
      END,
      now()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a queue table for Google Calendar sync operations
CREATE TABLE IF NOT EXISTS google_calendar_sync_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  appointment_id uuid,
  operation text NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  appointment_data jsonb NOT NULL,
  processed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  error_message text
);

-- Enable RLS on the sync queue table
ALTER TABLE google_calendar_sync_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "System can manage sync queue" ON google_calendar_sync_queue;
CREATE POLICY "System can manage sync queue" ON google_calendar_sync_queue 
FOR ALL USING (true);

-- Create triggers for automatic Google Calendar sync
DROP TRIGGER IF EXISTS appointment_google_sync_trigger ON appointments;
CREATE TRIGGER appointment_google_sync_trigger
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION sync_appointment_to_google_calendar();

-- Function to process the sync queue (will be called by edge function)
CREATE OR REPLACE FUNCTION process_google_calendar_sync_queue()
RETURNS void AS $$
DECLARE
  queue_item RECORD;
BEGIN
  -- Get unprocessed items from the queue
  FOR queue_item IN 
    SELECT * FROM google_calendar_sync_queue 
    WHERE processed = false 
    ORDER BY created_at ASC 
    LIMIT 10
  LOOP
    -- Mark as processed (the actual sync will be done by the edge function)
    UPDATE google_calendar_sync_queue 
    SET processed = true, processed_at = now()
    WHERE id = queue_item.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;