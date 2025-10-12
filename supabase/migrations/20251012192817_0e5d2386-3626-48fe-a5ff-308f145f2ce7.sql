-- Phase 3: Database Triggers for Automatic Notifications

-- ========================================
-- CASES MODULE TRIGGERS
-- ========================================

-- Function: Notify when case is created
CREATE OR REPLACE FUNCTION notify_case_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_ids uuid[];
  recipient_id uuid;
BEGIN
  -- Collect all recipients: assigned_to, assigned_users, and admin
  recipient_ids := ARRAY[]::uuid[];
  
  -- Add assigned_to
  IF NEW.assigned_to IS NOT NULL THEN
    recipient_ids := array_append(recipient_ids, NEW.assigned_to);
  END IF;
  
  -- Add assigned_users
  IF NEW.assigned_users IS NOT NULL AND array_length(NEW.assigned_users, 1) > 0 THEN
    recipient_ids := recipient_ids || NEW.assigned_users;
  END IF;
  
  -- Add all admins from the same firm
  FOR recipient_id IN 
    SELECT tm.user_id 
    FROM team_members tm 
    WHERE tm.firm_id = NEW.firm_id 
    AND tm.role = 'admin'
  LOOP
    recipient_ids := array_append(recipient_ids, recipient_id);
  END LOOP;
  
  -- Remove duplicates and nulls
  recipient_ids := ARRAY(SELECT DISTINCT unnest(recipient_ids) WHERE unnest IS NOT NULL);
  
  -- Insert notification for each recipient
  IF array_length(recipient_ids, 1) > 0 THEN
    INSERT INTO notifications (
      recipient_id,
      notification_type,
      title,
      message,
      reference_id,
      category,
      priority,
      action_url,
      metadata,
      read
    )
    SELECT
      unnest(recipient_ids),
      'case_created',
      'New Case Created',
      'Case "' || NEW.case_title || '" has been created and assigned to you',
      NEW.id,
      'case',
      'normal',
      '/cases/' || NEW.id,
      jsonb_build_object('case_title', NEW.case_title, 'case_number', NEW.case_number),
      false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function: Notify when case status changes
CREATE OR REPLACE FUNCTION notify_case_status_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_ids uuid[];
BEGIN
  -- Collect all case members
  recipient_ids := ARRAY[NEW.created_by, NEW.assigned_to] || COALESCE(NEW.assigned_users, ARRAY[]::uuid[]);
  recipient_ids := ARRAY(SELECT DISTINCT unnest(recipient_ids) WHERE unnest IS NOT NULL);
  
  -- Insert notification for each recipient
  IF array_length(recipient_ids, 1) > 0 THEN
    INSERT INTO notifications (
      recipient_id,
      notification_type,
      title,
      message,
      reference_id,
      category,
      priority,
      action_url,
      metadata,
      read
    )
    SELECT
      unnest(recipient_ids),
      'case_status_changed',
      'Case Status Changed',
      'Case "' || NEW.case_title || '" status changed from ' || OLD.status || ' to ' || NEW.status,
      NEW.id,
      'case',
      'normal',
      '/cases/' || NEW.id,
      jsonb_build_object(
        'case_title', NEW.case_title,
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function: Notify when case is closed
CREATE OR REPLACE FUNCTION notify_case_closed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_ids uuid[];
BEGIN
  -- Get all team members and case members
  SELECT ARRAY(
    SELECT DISTINCT user_id 
    FROM team_members 
    WHERE firm_id = NEW.firm_id
    UNION
    SELECT NEW.created_by
    UNION
    SELECT NEW.assigned_to
    UNION
    SELECT unnest(COALESCE(NEW.assigned_users, ARRAY[]::uuid[]))
  ) INTO recipient_ids;
  
  recipient_ids := ARRAY(SELECT DISTINCT unnest(recipient_ids) WHERE unnest IS NOT NULL);
  
  -- Insert notification for each recipient
  IF array_length(recipient_ids, 1) > 0 THEN
    INSERT INTO notifications (
      recipient_id,
      notification_type,
      title,
      message,
      reference_id,
      category,
      priority,
      action_url,
      metadata,
      read
    )
    SELECT
      unnest(recipient_ids),
      'case_closed',
      'Case Closed',
      'Case "' || NEW.case_title || '" has been closed',
      NEW.id,
      'case',
      'normal',
      '/cases/' || NEW.id,
      jsonb_build_object('case_title', NEW.case_title),
      false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for cases
CREATE TRIGGER case_created_notification
  AFTER INSERT ON cases
  FOR EACH ROW
  EXECUTE FUNCTION notify_case_created();

CREATE TRIGGER case_status_changed_notification
  AFTER UPDATE ON cases
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_case_status_changed();

CREATE TRIGGER case_closed_notification
  AFTER UPDATE ON cases
  FOR EACH ROW
  WHEN (OLD.status <> 'closed' AND NEW.status = 'closed')
  EXECUTE FUNCTION notify_case_closed();

-- ========================================
-- HEARINGS MODULE TRIGGERS
-- ========================================

-- Function: Notify when hearing is scheduled
CREATE OR REPLACE FUNCTION notify_hearing_scheduled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_ids uuid[];
  case_title text;
BEGIN
  -- Get case information
  SELECT c.case_title INTO case_title
  FROM cases c
  WHERE c.id = NEW.case_id;
  
  -- Get all case members
  SELECT ARRAY(
    SELECT DISTINCT unnest(ARRAY[c.created_by, c.assigned_to] || COALESCE(c.assigned_users, ARRAY[]::uuid[]))
    FROM cases c
    WHERE c.id = NEW.case_id
  ) INTO recipient_ids;
  
  recipient_ids := ARRAY(SELECT DISTINCT unnest(recipient_ids) WHERE unnest IS NOT NULL);
  
  -- Insert notification for each recipient
  IF array_length(recipient_ids, 1) > 0 THEN
    INSERT INTO notifications (
      recipient_id,
      notification_type,
      title,
      message,
      reference_id,
      category,
      priority,
      action_url,
      metadata,
      read
    )
    SELECT
      unnest(recipient_ids),
      'hearing_scheduled',
      'Hearing Scheduled',
      'New hearing scheduled for "' || case_title || '" on ' || NEW.hearing_date || ' at ' || NEW.court_name,
      NEW.id,
      'hearing',
      'high',
      '/cases/' || NEW.case_id || '?tab=hearings',
      jsonb_build_object(
        'case_title', case_title,
        'hearing_date', NEW.hearing_date,
        'court_name', NEW.court_name,
        'hearing_type', NEW.hearing_type
      ),
      false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function: Notify when hearing is updated
CREATE OR REPLACE FUNCTION notify_hearing_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_ids uuid[];
  case_title text;
  change_desc text;
BEGIN
  -- Get case information
  SELECT c.case_title INTO case_title
  FROM cases c
  WHERE c.id = NEW.case_id;
  
  -- Determine what changed
  IF OLD.hearing_date <> NEW.hearing_date THEN
    change_desc := 'Date changed from ' || OLD.hearing_date || ' to ' || NEW.hearing_date;
  ELSIF OLD.hearing_time IS DISTINCT FROM NEW.hearing_time THEN
    change_desc := 'Time updated';
  ELSIF OLD.court_name <> NEW.court_name THEN
    change_desc := 'Court changed to ' || NEW.court_name;
  ELSE
    change_desc := 'Hearing details updated';
  END IF;
  
  -- Get all case members
  SELECT ARRAY(
    SELECT DISTINCT unnest(ARRAY[c.created_by, c.assigned_to] || COALESCE(c.assigned_users, ARRAY[]::uuid[]))
    FROM cases c
    WHERE c.id = NEW.case_id
  ) INTO recipient_ids;
  
  recipient_ids := ARRAY(SELECT DISTINCT unnest(recipient_ids) WHERE unnest IS NOT NULL);
  
  -- Insert notification for each recipient
  IF array_length(recipient_ids, 1) > 0 THEN
    INSERT INTO notifications (
      recipient_id,
      notification_type,
      title,
      message,
      reference_id,
      category,
      priority,
      action_url,
      metadata,
      read
    )
    SELECT
      unnest(recipient_ids),
      'hearing_updated',
      'Hearing Updated',
      'Hearing for "' || case_title || '" was updated: ' || change_desc,
      NEW.id,
      'hearing',
      'high',
      '/cases/' || NEW.case_id || '?tab=hearings',
      jsonb_build_object(
        'case_title', case_title,
        'hearing_date', NEW.hearing_date,
        'change', change_desc
      ),
      false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for hearings
CREATE TRIGGER hearing_scheduled_notification
  AFTER INSERT ON hearings
  FOR EACH ROW
  EXECUTE FUNCTION notify_hearing_scheduled();

CREATE TRIGGER hearing_updated_notification
  AFTER UPDATE ON hearings
  FOR EACH ROW
  WHEN (
    OLD.hearing_date IS DISTINCT FROM NEW.hearing_date OR
    OLD.hearing_time IS DISTINCT FROM NEW.hearing_time OR
    OLD.court_name IS DISTINCT FROM NEW.court_name
  )
  EXECUTE FUNCTION notify_hearing_updated();

-- ========================================
-- DOCUMENTS MODULE TRIGGERS
-- ========================================

-- Function: Notify when document is uploaded
CREATE OR REPLACE FUNCTION notify_document_uploaded()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_ids uuid[];
  case_title text;
  uploader_name text;
BEGIN
  -- Only notify if document is associated with a case
  IF NEW.case_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get case information
  SELECT c.case_title INTO case_title
  FROM cases c
  WHERE c.id = NEW.case_id;
  
  -- Get uploader name
  SELECT p.full_name INTO uploader_name
  FROM profiles p
  WHERE p.id = COALESCE(NEW.uploaded_by_user_id, NEW.uploaded_by);
  
  -- Get all case members
  SELECT ARRAY(
    SELECT DISTINCT unnest(ARRAY[c.created_by, c.assigned_to] || COALESCE(c.assigned_users, ARRAY[]::uuid[]))
    FROM cases c
    WHERE c.id = NEW.case_id
  ) INTO recipient_ids;
  
  recipient_ids := ARRAY(SELECT DISTINCT unnest(recipient_ids) WHERE unnest IS NOT NULL);
  
  -- Insert notification for each recipient (except the uploader)
  IF array_length(recipient_ids, 1) > 0 THEN
    INSERT INTO notifications (
      recipient_id,
      notification_type,
      title,
      message,
      reference_id,
      category,
      priority,
      action_url,
      metadata,
      read
    )
    SELECT
      unnest(recipient_ids),
      'document_uploaded',
      'Document Uploaded',
      'New document "' || NEW.file_name || '" uploaded to "' || case_title || '"',
      NEW.id,
      'document',
      'normal',
      '/cases/' || NEW.case_id || '?tab=documents',
      jsonb_build_object(
        'case_title', case_title,
        'file_name', NEW.file_name,
        'uploaded_by', uploader_name
      ),
      false
    WHERE unnest <> COALESCE(NEW.uploaded_by_user_id, NEW.uploaded_by);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function: Notify when document is deleted
CREATE OR REPLACE FUNCTION notify_document_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_ids uuid[];
  case_title text;
BEGIN
  -- Only notify if document was associated with a case
  IF OLD.case_id IS NULL THEN
    RETURN OLD;
  END IF;
  
  -- Get case information
  SELECT c.case_title INTO case_title
  FROM cases c
  WHERE c.id = OLD.case_id;
  
  -- Get all case members
  SELECT ARRAY(
    SELECT DISTINCT unnest(ARRAY[c.created_by, c.assigned_to] || COALESCE(c.assigned_users, ARRAY[]::uuid[]))
    FROM cases c
    WHERE c.id = OLD.case_id
  ) INTO recipient_ids;
  
  recipient_ids := ARRAY(SELECT DISTINCT unnest(recipient_ids) WHERE unnest IS NOT NULL);
  
  -- Insert notification for each recipient
  IF array_length(recipient_ids, 1) > 0 THEN
    INSERT INTO notifications (
      recipient_id,
      notification_type,
      title,
      message,
      reference_id,
      category,
      priority,
      action_url,
      metadata,
      read
    )
    SELECT
      unnest(recipient_ids),
      'document_deleted',
      'Document Deleted',
      'Document "' || OLD.file_name || '" was deleted from "' || case_title || '"',
      OLD.id,
      'document',
      'normal',
      '/cases/' || OLD.case_id || '?tab=documents',
      jsonb_build_object(
        'case_title', case_title,
        'file_name', OLD.file_name
      ),
      false;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Drop existing document triggers if they exist
DROP TRIGGER IF EXISTS log_document_activity_trigger ON documents;

-- Create new triggers for documents
CREATE TRIGGER document_uploaded_notification
  AFTER INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION notify_document_uploaded();

CREATE TRIGGER document_deleted_notification
  AFTER DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION notify_document_deleted();

-- ========================================
-- INVOICES MODULE TRIGGERS
-- ========================================

-- Function: Notify when invoice is created
CREATE OR REPLACE FUNCTION notify_invoice_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_ids uuid[];
  finance_staff uuid[];
BEGIN
  -- Get finance team (admin and office_staff)
  SELECT ARRAY(
    SELECT user_id 
    FROM team_members 
    WHERE firm_id = NEW.firm_id 
    AND role IN ('admin', 'office_staff')
  ) INTO finance_staff;
  
  -- Combine client and finance team
  recipient_ids := ARRAY[NEW.client_id] || finance_staff;
  recipient_ids := ARRAY(SELECT DISTINCT unnest(recipient_ids) WHERE unnest IS NOT NULL);
  
  -- Insert notification for each recipient
  IF array_length(recipient_ids, 1) > 0 THEN
    INSERT INTO notifications (
      recipient_id,
      notification_type,
      title,
      message,
      reference_id,
      category,
      priority,
      action_url,
      metadata,
      read
    )
    SELECT
      unnest(recipient_ids),
      'invoice_created',
      'New Invoice',
      'Invoice ' || NEW.invoice_number || ' for ₹' || NEW.total_amount || ' has been created',
      NEW.id,
      'invoice',
      'normal',
      '/invoices',
      jsonb_build_object(
        'invoice_number', NEW.invoice_number,
        'amount', NEW.total_amount
      ),
      false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function: Notify when invoice is paid
CREATE OR REPLACE FUNCTION notify_invoice_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_ids uuid[];
  finance_staff uuid[];
  case_handler uuid;
BEGIN
  -- Get finance team
  SELECT ARRAY(
    SELECT user_id 
    FROM team_members 
    WHERE firm_id = NEW.firm_id 
    AND role IN ('admin', 'office_staff')
  ) INTO finance_staff;
  
  -- Get case handler if case_id exists
  IF NEW.case_id IS NOT NULL THEN
    SELECT assigned_to INTO case_handler
    FROM cases
    WHERE id = NEW.case_id;
  END IF;
  
  -- Combine client, finance team, and case handler
  recipient_ids := ARRAY[NEW.client_id, case_handler] || finance_staff;
  recipient_ids := ARRAY(SELECT DISTINCT unnest(recipient_ids) WHERE unnest IS NOT NULL);
  
  -- Insert notification for each recipient
  IF array_length(recipient_ids, 1) > 0 THEN
    INSERT INTO notifications (
      recipient_id,
      notification_type,
      title,
      message,
      reference_id,
      category,
      priority,
      action_url,
      metadata,
      read
    )
    SELECT
      unnest(recipient_ids),
      'invoice_paid',
      'Invoice Paid',
      'Invoice ' || NEW.invoice_number || ' has been paid',
      NEW.id,
      'invoice',
      'normal',
      '/invoices',
      jsonb_build_object(
        'invoice_number', NEW.invoice_number,
        'amount', NEW.total_amount
      ),
      false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for invoices
CREATE TRIGGER invoice_created_notification
  AFTER INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION notify_invoice_created();

CREATE TRIGGER invoice_paid_notification
  AFTER UPDATE ON invoices
  FOR EACH ROW
  WHEN (OLD.status <> 'paid' AND NEW.status = 'paid')
  EXECUTE FUNCTION notify_invoice_paid();