-- Migration: Add Novu notification triggers for real-time updates
-- This migration creates database triggers that automatically send notifications
-- to Novu when important records are created or updated

-- Create a function that calls the notify-novu edge function
CREATE OR REPLACE FUNCTION notify_novu()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id text;
  v_anon_key text;
  v_function_url text;
  v_payload jsonb;
BEGIN
  -- Get Supabase project credentials
  v_project_id := current_setting('app.settings.supabase_project_id', true);
  v_anon_key := current_setting('app.settings.supabase_anon_key', true);
  
  -- Construct edge function URL
  v_function_url := 'https://' || COALESCE(v_project_id, 'hpcnipcbymruvsnqrmjx') || '.functions.supabase.co/notify-novu';
  
  -- Build payload
  v_payload := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'eventType', TG_OP,
    'record', row_to_json(NEW)
  );
  
  -- Call edge function asynchronously using pg_net (if available)
  -- Note: This requires pg_net extension to be enabled
  BEGIN
    PERFORM net.http_post(
      url := v_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', COALESCE(v_anon_key, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY')
      ),
      body := v_payload
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      RAISE WARNING 'Failed to call notify-novu: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS notify_novu_trigger ON appointments;
DROP TRIGGER IF EXISTS notify_novu_trigger ON tasks;
DROP TRIGGER IF EXISTS notify_novu_trigger ON cases;
DROP TRIGGER IF EXISTS notify_novu_trigger ON clients;
DROP TRIGGER IF EXISTS notify_novu_trigger ON documents;
DROP TRIGGER IF EXISTS notify_novu_trigger ON hearings;
DROP TRIGGER IF EXISTS notify_novu_trigger ON messages;
DROP TRIGGER IF EXISTS notify_novu_trigger ON message_threads;

-- Create triggers for appointments table
CREATE TRIGGER notify_novu_trigger
AFTER INSERT OR UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION notify_novu();

-- Create triggers for tasks table
CREATE TRIGGER notify_novu_trigger
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION notify_novu();

-- Create triggers for cases table
CREATE TRIGGER notify_novu_trigger
AFTER INSERT OR UPDATE ON cases
FOR EACH ROW
EXECUTE FUNCTION notify_novu();

-- Create triggers for clients table
CREATE TRIGGER notify_novu_trigger
AFTER INSERT OR UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION notify_novu();

-- Create triggers for documents table
CREATE TRIGGER notify_novu_trigger
AFTER INSERT OR UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION notify_novu();

-- Create triggers for hearings table
CREATE TRIGGER notify_novu_trigger
AFTER INSERT OR UPDATE ON hearings
FOR EACH ROW
EXECUTE FUNCTION notify_novu();

-- Create triggers for messages table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    EXECUTE 'CREATE TRIGGER notify_novu_trigger
    AFTER INSERT OR UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_novu()';
  END IF;
END $$;

-- Create triggers for message_threads table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'message_threads') THEN
    EXECUTE 'CREATE TRIGGER notify_novu_trigger
    AFTER INSERT OR UPDATE ON message_threads
    FOR EACH ROW
    EXECUTE FUNCTION notify_novu()';
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON FUNCTION notify_novu() IS 'Triggers Novu notifications when records are created or updated';