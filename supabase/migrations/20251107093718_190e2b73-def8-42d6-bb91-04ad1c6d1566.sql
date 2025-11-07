-- Restore handle_notification_trigger function
CREATE OR REPLACE FUNCTION handle_notification_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/notify-knock',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'eventType', TG_OP,
      'record', row_to_json(NEW),
      'oldRecord', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
    )
  );
  RETURN NEW;
END;
$$;

-- Recreate triggers for all tables

-- APPOINTMENTS
DROP TRIGGER IF EXISTS on_appointment_notification ON appointments;
CREATE TRIGGER on_appointment_notification
AFTER INSERT ON appointments
FOR EACH ROW
EXECUTE FUNCTION handle_notification_trigger();

-- CASES  
DROP TRIGGER IF EXISTS on_case_notification ON cases;
CREATE TRIGGER on_case_notification
AFTER INSERT OR UPDATE ON cases
FOR EACH ROW
EXECUTE FUNCTION handle_notification_trigger();

-- CONTACTS
DROP TRIGGER IF EXISTS on_contact_created ON contacts;
CREATE TRIGGER on_contact_created
AFTER INSERT ON contacts
FOR EACH ROW
EXECUTE FUNCTION notify_contact_created();

DROP TRIGGER IF EXISTS on_contact_updated ON contacts;
CREATE TRIGGER on_contact_updated
AFTER UPDATE ON contacts
FOR EACH ROW
WHEN (OLD IS DISTINCT FROM NEW)
EXECUTE FUNCTION notify_contact_updated();

-- CLIENTS
DROP TRIGGER IF EXISTS on_client_created ON clients;
CREATE TRIGGER on_client_created
AFTER INSERT ON clients
FOR EACH ROW
EXECUTE FUNCTION notify_client_created();

DROP TRIGGER IF EXISTS on_client_updated ON clients;
CREATE TRIGGER on_client_updated
AFTER UPDATE ON clients
FOR EACH ROW
WHEN (OLD IS DISTINCT FROM NEW)
EXECUTE FUNCTION notify_client_updated();

-- TASKS
DROP TRIGGER IF EXISTS on_task_notification ON tasks;
CREATE TRIGGER on_task_notification
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION handle_notification_trigger();

-- HEARINGS
DROP TRIGGER IF EXISTS on_hearing_notification ON hearings;
CREATE TRIGGER on_hearing_notification
AFTER INSERT ON hearings
FOR EACH ROW
EXECUTE FUNCTION handle_notification_trigger();

-- DOCUMENTS
DROP TRIGGER IF EXISTS on_document_notification ON documents;
CREATE TRIGGER on_document_notification
AFTER INSERT ON documents
FOR EACH ROW
EXECUTE FUNCTION handle_notification_trigger();

-- NOTES
DROP TRIGGER IF EXISTS on_note_created ON notes_v2;
CREATE TRIGGER on_note_created
AFTER INSERT ON notes_v2
FOR EACH ROW
EXECUTE FUNCTION notify_note_created();

-- CASE ORDERS
DROP TRIGGER IF EXISTS on_case_order_created ON case_orders;
CREATE TRIGGER on_case_order_created
AFTER INSERT ON case_orders
FOR EACH ROW
EXECUTE FUNCTION notify_case_order_created();