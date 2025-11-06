-- =====================================================
-- Knock Comprehensive Notification Triggers
-- =====================================================
-- This migration adds triggers for all modules to send
-- notifications via the notify-knock edge function
-- =====================================================

-- 🧍‍♂️ CLIENTS MODULE
-- Trigger for client creation
CREATE OR REPLACE FUNCTION notify_client_created()
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
      'table', 'clients',
      'eventType', 'INSERT',
      'record', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_client_created
AFTER INSERT ON clients
FOR EACH ROW
EXECUTE FUNCTION notify_client_created();

-- Trigger for client updates
CREATE OR REPLACE FUNCTION notify_client_updated()
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
      'table', 'clients',
      'eventType', 'UPDATE',
      'record', row_to_json(NEW),
      'oldRecord', row_to_json(OLD)
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_client_updated
AFTER UPDATE ON clients
FOR EACH ROW
WHEN (OLD IS DISTINCT FROM NEW)
EXECUTE FUNCTION notify_client_updated();

-- 📇 CONTACTS MODULE
-- Trigger for contact creation
CREATE OR REPLACE FUNCTION notify_contact_created()
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
      'table', 'contacts',
      'eventType', 'INSERT',
      'record', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_contact_created
AFTER INSERT ON contacts
FOR EACH ROW
EXECUTE FUNCTION notify_contact_created();

-- Trigger for contact updates
CREATE OR REPLACE FUNCTION notify_contact_updated()
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
      'table', 'contacts',
      'eventType', 'UPDATE',
      'record', row_to_json(NEW),
      'oldRecord', row_to_json(OLD)
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_contact_updated
AFTER UPDATE ON contacts
FOR EACH ROW
WHEN (OLD IS DISTINCT FROM NEW)
EXECUTE FUNCTION notify_contact_updated();

-- 🗒️ NOTES MODULE
-- Trigger for note creation
CREATE OR REPLACE FUNCTION notify_note_created()
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
      'table', 'notes_v2',
      'eventType', 'INSERT',
      'record', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_note_created
AFTER INSERT ON notes_v2
FOR EACH ROW
EXECUTE FUNCTION notify_note_created();

-- 🧾 CASE ORDERS MODULE
-- Trigger for case order creation
CREATE OR REPLACE FUNCTION notify_case_order_created()
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
      'table', 'case_orders',
      'eventType', 'INSERT',
      'record', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_case_order_created
AFTER INSERT ON case_orders
FOR EACH ROW
EXECUTE FUNCTION notify_case_order_created();

-- ⚖️ UPDATE EXISTING TRIGGERS TO PASS OLD RECORD
-- Update cases trigger to pass old record for status change detection
DROP TRIGGER IF EXISTS on_case_notification ON cases;

CREATE TRIGGER on_case_notification
AFTER INSERT OR UPDATE ON cases
FOR EACH ROW
EXECUTE FUNCTION handle_notification_trigger();

-- Update tasks trigger to pass old record for completion detection
DROP TRIGGER IF EXISTS on_task_notification ON tasks;

CREATE TRIGGER on_task_notification
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION handle_notification_trigger();

-- Update existing handle_notification_trigger to include old record
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