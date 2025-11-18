-- =====================================================
-- NOTIFICATION TRIGGERS - Phase 4
-- Automatically send notifications when events occur
-- =====================================================

-- 1. CASE EVENT TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_case_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the notify-case-events edge function asynchronously
  PERFORM net.http_post(
    url := 'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/notify-case-events',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY'
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'record', row_to_json(NEW),
      'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the main operation
    RAISE WARNING 'Failed to send case notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS case_notification_trigger ON cases;
CREATE TRIGGER case_notification_trigger
AFTER INSERT OR UPDATE ON cases
FOR EACH ROW
EXECUTE FUNCTION trigger_case_notifications();

-- 2. HEARING EVENT TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_hearing_notifications()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/notify-hearing-events',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY'
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'record', row_to_json(NEW),
      'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send hearing notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS hearing_notification_trigger ON case_hearings;
CREATE TRIGGER hearing_notification_trigger
AFTER INSERT OR UPDATE ON case_hearings
FOR EACH ROW
EXECUTE FUNCTION trigger_hearing_notifications();

-- 3. TASK EVENT TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_task_notifications()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/notify-task-events',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY'
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'record', row_to_json(NEW),
      'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send task notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS task_notification_trigger ON tasks;
CREATE TRIGGER task_notification_trigger
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION trigger_task_notifications();

-- 4. APPOINTMENT EVENT TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_appointment_notifications()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/notify-appointment-events',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY'
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'record', row_to_json(NEW),
      'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send appointment notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS appointment_notification_trigger ON appointments;
CREATE TRIGGER appointment_notification_trigger
AFTER INSERT OR UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION trigger_appointment_notifications();

-- 5. DOCUMENT EVENT TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_document_notifications()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM net.http_post(
      url := 'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/send-smart-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY'
      ),
      body := jsonb_build_object(
        'event_type', 'document_uploaded',
        'recipients', 'case_members',
        'case_id', NEW.case_id,
        'reference_id', NEW.id,
        'title', 'New Document Uploaded',
        'message', 'A new document has been uploaded: ' || COALESCE(NEW.document_type, 'Document'),
        'category', 'document',
        'priority', 'normal',
        'action_url', '/cases/' || NEW.case_id,
        'metadata', jsonb_build_object(
          'document_type', NEW.document_type,
          'document_no', NEW.document_no
        )
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send document notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS document_notification_trigger ON case_documents;
CREATE TRIGGER document_notification_trigger
AFTER INSERT ON case_documents
FOR EACH ROW
EXECUTE FUNCTION trigger_document_notifications();

-- 6. CLIENT EVENT TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_client_notifications()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM net.http_post(
      url := 'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/send-smart-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY'
      ),
      body := jsonb_build_object(
        'event_type', 'client_created',
        'recipients', 'team',
        'firm_id', NEW.firm_id,
        'reference_id', NEW.id,
        'title', 'New Client Added',
        'message', 'New client: ' || NEW.name,
        'category', 'client',
        'priority', 'normal',
        'action_url', '/clients/' || NEW.id,
        'metadata', jsonb_build_object('client_name', NEW.name)
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send client notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS client_notification_trigger ON clients;
CREATE TRIGGER client_notification_trigger
AFTER INSERT ON clients
FOR EACH ROW
EXECUTE FUNCTION trigger_client_notifications();

-- 7. TEAM MEMBER EVENT TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_team_notifications()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM net.http_post(
      url := 'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/send-smart-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY'
      ),
      body := jsonb_build_object(
        'event_type', 'team_member_joined',
        'recipients', 'team',
        'firm_id', NEW.firm_id,
        'reference_id', NEW.id,
        'title', 'New Team Member',
        'message', 'A new team member has joined: ' || NEW.full_name,
        'category', 'team',
        'priority', 'normal',
        'action_url', '/team',
        'metadata', jsonb_build_object('member_name', NEW.full_name, 'role', NEW.role)
      )
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.role != NEW.role THEN
    PERFORM net.http_post(
      url := 'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/send-smart-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY'
      ),
      body := jsonb_build_object(
        'event_type', 'team_member_role_changed',
        'recipients', 'single',
        'recipient_ids', ARRAY[NEW.user_id],
        'reference_id', NEW.id,
        'title', 'Role Updated',
        'message', 'Your role has been changed to ' || NEW.role,
        'category', 'team',
        'priority', 'high',
        'action_url', '/team',
        'metadata', jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role)
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send team notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS team_notification_trigger ON team_members;
CREATE TRIGGER team_notification_trigger
AFTER INSERT OR UPDATE ON team_members
FOR EACH ROW
EXECUTE FUNCTION trigger_team_notifications();

-- Add comments
COMMENT ON FUNCTION trigger_case_notifications IS 'Automatically sends notifications for case events';
COMMENT ON FUNCTION trigger_hearing_notifications IS 'Automatically sends notifications for hearing events';
COMMENT ON FUNCTION trigger_task_notifications IS 'Automatically sends notifications for task events';
COMMENT ON FUNCTION trigger_appointment_notifications IS 'Automatically sends notifications for appointment events';
