-- Fix the notify_novu_on_change function to use proper authentication
CREATE OR REPLACE FUNCTION notify_novu_on_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  record_data jsonb;
  event_type text;
BEGIN
  -- Determine event type and record data
  IF TG_OP = 'INSERT' THEN
    record_data := to_jsonb(NEW);
    event_type := 'INSERT';
  ELSIF TG_OP = 'UPDATE' THEN
    record_data := to_jsonb(NEW);
    event_type := 'UPDATE';
  ELSIF TG_OP = 'DELETE' THEN
    record_data := to_jsonb(OLD);
    event_type := 'DELETE';
  END IF;

  -- Call the notify-novu edge function asynchronously using service role
  PERFORM net.http_post(
    url := 'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/notify-novu',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTI2MjM1MywiZXhwIjoyMDYwODM4MzUzfQ.r41BH7VF1BNcT-pWJgSxv72u5tWJ01MN5c96wX7NU7Q'
    ),
    body := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'eventType', event_type,
      'record', record_data
    )
  );

  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;