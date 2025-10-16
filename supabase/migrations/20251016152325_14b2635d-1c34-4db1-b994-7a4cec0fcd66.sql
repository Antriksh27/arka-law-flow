-- Create function to notify Novu on database changes
CREATE OR REPLACE FUNCTION notify_novu_on_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  record_data jsonb;
  event_type text;
  subscriber_id uuid;
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

  -- Call the notify-novu edge function asynchronously
  PERFORM net.http_post(
    url := 'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/notify-novu',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'token'
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

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS notify_novu_cases_trigger ON cases;
DROP TRIGGER IF EXISTS notify_novu_clients_trigger ON clients;
DROP TRIGGER IF EXISTS notify_novu_appointments_trigger ON appointments;
DROP TRIGGER IF EXISTS notify_novu_tasks_trigger ON tasks;
DROP TRIGGER IF EXISTS notify_novu_invoices_trigger ON invoices;
DROP TRIGGER IF EXISTS notify_novu_documents_trigger ON documents;
DROP TRIGGER IF EXISTS notify_novu_hearings_trigger ON hearings;
DROP TRIGGER IF EXISTS notify_novu_messages_trigger ON messages;

-- Create triggers for cases table
CREATE TRIGGER notify_novu_cases_trigger
AFTER INSERT OR UPDATE ON cases
FOR EACH ROW
EXECUTE FUNCTION notify_novu_on_change();

-- Create triggers for clients table
CREATE TRIGGER notify_novu_clients_trigger
AFTER INSERT OR UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION notify_novu_on_change();

-- Create triggers for appointments table
CREATE TRIGGER notify_novu_appointments_trigger
AFTER INSERT OR UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION notify_novu_on_change();

-- Create triggers for tasks table
CREATE TRIGGER notify_novu_tasks_trigger
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION notify_novu_on_change();

-- Create triggers for invoices table
CREATE TRIGGER notify_novu_invoices_trigger
AFTER INSERT OR UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION notify_novu_on_change();

-- Create triggers for documents table
CREATE TRIGGER notify_novu_documents_trigger
AFTER INSERT ON documents
FOR EACH ROW
EXECUTE FUNCTION notify_novu_on_change();

-- Create triggers for hearings table
CREATE TRIGGER notify_novu_hearings_trigger
AFTER INSERT OR UPDATE ON hearings
FOR EACH ROW
EXECUTE FUNCTION notify_novu_on_change();

-- Create triggers for messages table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN
    EXECUTE 'CREATE TRIGGER notify_novu_messages_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_novu_on_change()';
  END IF;
END $$;