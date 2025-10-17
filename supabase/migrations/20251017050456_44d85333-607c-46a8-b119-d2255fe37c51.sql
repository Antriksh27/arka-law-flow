-- Drop existing notify_novu_on_change function and recreate with fixed structure
DROP FUNCTION IF EXISTS notify_novu_on_change() CASCADE;

-- Create improved function that sends proper payload to notify-novu edge function
CREATE OR REPLACE FUNCTION notify_novu_on_change()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
BEGIN
  -- Get the Supabase project URL from environment
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/notify-novu';
  
  -- If URL not set in config, construct it from known project ID
  IF function_url IS NULL OR function_url = '/functions/v1/notify-novu' THEN
    function_url := 'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/notify-novu';
  END IF;

  -- Send notification with proper structure
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'eventType', TG_OP,
      'record', row_to_json(NEW)
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop all existing triggers
DROP TRIGGER IF EXISTS notify_novu_cases ON cases;
DROP TRIGGER IF EXISTS notify_novu_clients ON clients;
DROP TRIGGER IF EXISTS notify_novu_appointments ON appointments;
DROP TRIGGER IF EXISTS notify_novu_tasks ON tasks;
DROP TRIGGER IF EXISTS notify_novu_hearings ON hearings;
DROP TRIGGER IF EXISTS notify_novu_documents ON documents;
DROP TRIGGER IF EXISTS notify_novu_messages ON messages;

-- Recreate triggers for all relevant tables
CREATE TRIGGER notify_novu_cases
  AFTER INSERT OR UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION notify_novu_on_change();

CREATE TRIGGER notify_novu_clients
  AFTER INSERT OR UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION notify_novu_on_change();

CREATE TRIGGER notify_novu_appointments
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_novu_on_change();

CREATE TRIGGER notify_novu_tasks
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_novu_on_change();

CREATE TRIGGER notify_novu_hearings
  AFTER INSERT OR UPDATE ON hearings
  FOR EACH ROW
  EXECUTE FUNCTION notify_novu_on_change();

CREATE TRIGGER notify_novu_documents
  AFTER INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION notify_novu_on_change();

CREATE TRIGGER notify_novu_messages
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_novu_on_change();