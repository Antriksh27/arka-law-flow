-- Ensure all timestamp columns use proper timezone handling
-- Update existing appointments to ensure consistent timestamp format

-- Create a function to normalize timestamps to ensure they're stored consistently
CREATE OR REPLACE FUNCTION normalize_timestamp(input_timestamp timestamp with time zone)
RETURNS timestamp with time zone
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(input_timestamp, now());
$$;

-- Create a function to get current system timestamp
CREATE OR REPLACE FUNCTION get_system_timestamp()
RETURNS timestamp with time zone
LANGUAGE sql
STABLE
AS $$
  SELECT now();
$$;

-- Update the appointments table to ensure created_at is set properly
UPDATE appointments 
SET created_at = COALESCE(created_at, now())
WHERE created_at IS NULL;

-- Update contacts table to ensure timestamps are consistent
UPDATE contacts 
SET created_at = COALESCE(created_at, now()),
    updated_at = COALESCE(updated_at, now()),
    last_visited_at = COALESCE(last_visited_at, now())
WHERE created_at IS NULL OR updated_at IS NULL;

-- Create trigger to automatically set timestamps on appointments
CREATE OR REPLACE FUNCTION set_appointment_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at = COALESCE(NEW.created_at, now());
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply the trigger to appointments table if it doesn't exist
DROP TRIGGER IF EXISTS appointments_timestamps_trigger ON appointments;
CREATE TRIGGER appointments_timestamps_trigger
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION set_appointment_timestamps();

-- Ensure notifications table has proper timestamp handling
UPDATE notifications 
SET created_at = COALESCE(created_at, now())
WHERE created_at IS NULL;

COMMENT ON FUNCTION get_system_timestamp() IS 'Returns current system timestamp in UTC for consistent storage';
COMMENT ON FUNCTION normalize_timestamp(timestamp with time zone) IS 'Normalizes timestamps to ensure consistency';
COMMENT ON FUNCTION set_appointment_timestamps() IS 'Automatically sets created_at and updated_at timestamps for appointments';