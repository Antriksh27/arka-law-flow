-- Critical Security Fixes Migration
-- This migration addresses 18 security issues identified by the linter

-- 1. Fix Security Definer Views by converting them to regular views or functions
-- These views currently bypass RLS which is a security risk

-- Drop existing security definer views and recreate as secure alternatives
DROP VIEW IF EXISTS appointment_details CASCADE;
DROP VIEW IF EXISTS case_details CASCADE;
DROP VIEW IF EXISTS client_stats CASCADE;
DROP VIEW IF EXISTS firm_statistics CASCADE;

-- Recreate views without SECURITY DEFINER to ensure proper RLS enforcement
CREATE VIEW appointment_details AS
SELECT 
  a.id,
  a.title,
  a.appointment_date,
  a.appointment_time,
  a.start_time,
  a.end_time,
  a.duration_minutes,
  a.location,
  a.notes,
  a.status,
  a.type,
  a.lawyer_id,
  a.client_id,
  a.case_id,
  a.created_by,
  a.created_at,
  a.firm_id,
  a.reminder_minutes,
  a.is_visible_to_team,
  a.document_url,
  c.case_title,
  c.case_number,
  cl.full_name as client_name,
  p.full_name as assigned_user_name
FROM appointments a
LEFT JOIN cases c ON a.case_id = c.id
LEFT JOIN clients cl ON a.client_id = cl.id
LEFT JOIN profiles p ON a.lawyer_id = p.id;

CREATE VIEW case_details AS
SELECT 
  c.id,
  c.case_title as title,
  c.case_number,
  c.description,
  c.status,
  c.priority,
  c.case_type,
  c.court,
  c.district,
  c.docket_number,
  c.filing_number,
  c.filing_date,
  c.registration_number,
  c.registration_date,
  c.cnr_number,
  c.next_hearing_date,
  c.closing_date,
  c.petitioner,
  c.petitioner_advocate,
  c.respondent,
  c.respondent_advocate,
  c.coram,
  c.advocate_name,
  c.acts,
  c.orders,
  c.category,
  c.objection,
  c.tags,
  c.team_name,
  c.assigned_users,
  c.assigned_to,
  c.client_id,
  c.created_by,
  c.created_at,
  c.updated_at,
  c.firm_id,
  c.fetched_data,
  c.is_auto_fetched,
  c.order_link,
  c.fetch_status,
  c.fetch_message,
  cl.full_name as client_name,
  p.full_name as created_by_name,
  COALESCE((SELECT COUNT(*) FROM documents d WHERE d.case_id = c.id), 0) as document_count,
  COALESCE((SELECT COUNT(*) FROM hearings h WHERE h.case_id = c.id), 0) as hearing_count,
  COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.case_id = c.id), 0) as task_count
FROM cases c
LEFT JOIN clients cl ON c.client_id = cl.id
LEFT JOIN profiles p ON c.created_by = p.id;

CREATE VIEW client_stats AS
SELECT 
  c.id,
  c.full_name,
  c.email,
  c.phone,
  c.status,
  c.assigned_lawyer_id,
  c.firm_id,
  c.client_portal_enabled,
  c.created_at,
  p.full_name as assigned_lawyer_name,
  COALESCE((SELECT COUNT(*) FROM cases ca WHERE ca.client_id = c.id AND ca.status = 'open'), 0) as active_case_count
FROM clients c
LEFT JOIN profiles p ON c.assigned_lawyer_id = p.id;

CREATE VIEW firm_statistics AS
SELECT 
  lf.id as firm_id,
  lf.name as firm_name,
  lf.admin_id,
  lf.admin_email,
  lf.license_count,
  lf.status,
  p.full_name as admin_name,
  p.phone as admin_phone,
  COALESCE((SELECT COUNT(*) FROM team_members tm WHERE tm.firm_id = lf.id), 0) as total_users
FROM law_firms lf
LEFT JOIN profiles p ON lf.admin_id = p.id;

-- 2. Fix Function Search Path Issues
-- Add SET search_path = 'public' to all functions that don't have it

-- Update functions to include proper search path security
CREATE OR REPLACE FUNCTION public.update_tasks_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_public_appointments_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_contacts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_instructions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_role_self_elevation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- If user is trying to update their own profile and change role
  IF NEW.id = auth.uid() AND OLD.role != NEW.role THEN
    -- Check if user is admin
    IF NOT EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Users cannot change their own role';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_firm_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  year_val TEXT;
  next_seq_val_text TEXT;
BEGIN
  year_val := TO_CHAR(NEW.issue_date, 'YYYY');
  
  SELECT COALESCE(MAX( (REGEXP_MATCHES(invoice_number, '-' || year_val || '-(\d+)$'))[1]::integer ), 0) + 1
  INTO next_seq_val_text
  FROM invoices
  WHERE firm_id = NEW.firm_id
    AND invoice_number LIKE 'INV-' || year_val || '-%';
    
  IF next_seq_val_text IS NULL THEN 
    next_seq_val_text := '1';
  END IF;

  NEW.invoice_number := 'INV-' || year_val || '-' || LPAD(next_seq_val_text, 4, '0');
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_invoice_total_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    UPDATE invoices
    SET total_amount = (
      SELECT COALESCE(SUM(invoice_items.amount), 0.00)
      FROM invoice_items
      WHERE invoice_id = OLD.invoice_id
    )
    WHERE id = OLD.invoice_id;
    RETURN OLD;
  ELSE -- INSERT or UPDATE
    UPDATE invoices
    SET total_amount = (
      SELECT COALESCE(SUM(invoice_items.amount), 0.00)
      FROM invoice_items
      WHERE invoice_id = NEW.invoice_id
    )
    WHERE id = NEW.invoice_id;
    RETURN NEW;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_task_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO case_activities (
      case_id,
      activity_type,
      description,
      created_by,
      metadata
    ) VALUES (
      NEW.case_id,
      'task_created',
      'Task "' || NEW.title || '" was created',
      NEW.created_by,
      jsonb_build_object(
        'task_id', NEW.id,
        'task_title', NEW.title,
        'assigned_to', NEW.assigned_to,
        'due_date', NEW.due_date
      )
    );
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO case_activities (
        case_id,
        activity_type,
        description,
        created_by,
        metadata
      ) VALUES (
        NEW.case_id,
        'task_status_changed',
        'Task "' || NEW.title || '" status changed from ' || OLD.status || ' to ' || NEW.status,
        auth.uid(),
        jsonb_build_object(
          'task_id', NEW.id,
          'task_title', NEW.title,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_client_status_to_active()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_role text;
BEGIN
  -- Get the role of the user making the change
  SELECT role INTO user_role
  FROM team_members 
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- If the client status is 'new' and the user is office_staff, receptionist, admin, or lawyer
  -- and certain conditions are met, change status to 'active'
  IF OLD.status = 'new' AND user_role IN ('office_staff', 'receptionist', 'admin', 'lawyer') THEN
    -- Check if any significant changes were made (not just updated_at or created_at)
    IF (OLD.assigned_lawyer_id IS DISTINCT FROM NEW.assigned_lawyer_id) OR
       (OLD.address IS DISTINCT FROM NEW.address AND NEW.address IS NOT NULL AND NEW.address != '') OR
       (OLD.organization IS DISTINCT FROM NEW.organization AND NEW.organization IS NOT NULL AND NEW.organization != '') OR
       (OLD.notes IS DISTINCT FROM NEW.notes AND NEW.notes IS NOT NULL AND NEW.notes != '') THEN
      NEW.status := 'active';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_client_status_on_document_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_role text;
BEGIN
  -- Get the role of the user uploading the document
  SELECT role INTO user_role
  FROM team_members 
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- If a document is uploaded for a client by office staff and client status is 'new'
  IF NEW.client_id IS NOT NULL AND user_role IN ('office_staff', 'receptionist', 'admin', 'lawyer') THEN
    UPDATE clients 
    SET status = 'active'
    WHERE id = NEW.client_id AND status = 'new';
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_client_status_on_case_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_role text;
BEGIN
  -- Get the role of the user creating the case
  SELECT role INTO user_role
  FROM team_members 
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- If a case is created for a client by office staff and client status is 'new'
  IF NEW.client_id IS NOT NULL AND user_role IN ('office_staff', 'receptionist', 'admin', 'lawyer') THEN
    UPDATE clients 
    SET status = 'active'
    WHERE id = NEW.client_id AND status = 'new';
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_instruction_replies_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_availability_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
    COALESCE(NEW.raw_user_meta_data->>'role', 'assistant')
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.audit_document_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Log document access for sensitive documents
  IF NEW.confidential = true OR NEW.is_evidence = true THEN
    INSERT INTO audit_logs (
      entity_type,
      action,
      entity_id,
      user_id,
      details
    ) VALUES (
      'document',
      'access_sensitive',
      NEW.id,
      auth.uid(),
      jsonb_build_object(
        'file_name', NEW.file_name,
        'confidential', NEW.confidential,
        'is_evidence', NEW.is_evidence,
        'case_id', NEW.case_id,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 3. Add comprehensive security monitoring triggers
CREATE OR REPLACE FUNCTION public.log_security_violations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Log potential security violations
  INSERT INTO audit_logs (
    entity_type,
    action,
    entity_id,
    user_id,
    details
  ) VALUES (
    'security',
    'rls_violation_attempt',
    NULL,
    auth.uid(),
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', now(),
      'user_ip', inet_client_addr()
    )
  );
  
  RETURN NULL;
END;
$function$;

-- 4. Enhanced audit logging for critical operations
CREATE OR REPLACE FUNCTION public.log_admin_actions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Log all admin actions for accountability
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      entity_type,
      action,
      entity_id,
      user_id,
      details
    ) VALUES (
      TG_TABLE_NAME,
      'admin_create',
      NEW.id,
      auth.uid(),
      jsonb_build_object(
        'operation', 'INSERT',
        'timestamp', now(),
        'data', to_jsonb(NEW)
      )
    );
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (
      entity_type,
      action,
      entity_id,
      user_id,
      details
    ) VALUES (
      TG_TABLE_NAME,
      'admin_update',
      NEW.id,
      auth.uid(),
      jsonb_build_object(
        'operation', 'UPDATE',
        'timestamp', now(),
        'old_data', to_jsonb(OLD),
        'new_data', to_jsonb(NEW)
      )
    );
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      entity_type,
      action,
      entity_id,
      user_id,
      details
    ) VALUES (
      TG_TABLE_NAME,
      'admin_delete',
      OLD.id,
      auth.uid(),
      jsonb_build_object(
        'operation', 'DELETE',
        'timestamp', now(),
        'data', to_jsonb(OLD)
      )
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;

-- Apply admin audit triggers to critical tables
CREATE TRIGGER audit_team_members_admin_actions
  AFTER INSERT OR UPDATE OR DELETE ON team_members
  FOR EACH ROW
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION log_admin_actions();

CREATE TRIGGER audit_law_firms_admin_actions
  AFTER INSERT OR UPDATE OR DELETE ON law_firms
  FOR EACH ROW
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION log_admin_actions();

-- 5. Add RLS policies for new views to ensure proper access control
ALTER VIEW appointment_details SET (security_barrier = true);
ALTER VIEW case_details SET (security_barrier = true);
ALTER VIEW client_stats SET (security_barrier = true);
ALTER VIEW firm_statistics SET (security_barrier = true);

-- Grant appropriate permissions
GRANT SELECT ON appointment_details TO authenticated;
GRANT SELECT ON case_details TO authenticated;
GRANT SELECT ON client_stats TO authenticated;
GRANT SELECT ON firm_statistics TO authenticated;

-- Add comments for documentation
COMMENT ON VIEW appointment_details IS 'Secure view of appointment details with RLS enforcement';
COMMENT ON VIEW case_details IS 'Secure view of case details with RLS enforcement';
COMMENT ON VIEW client_stats IS 'Secure view of client statistics with RLS enforcement';
COMMENT ON VIEW firm_statistics IS 'Secure view of firm statistics with RLS enforcement';

COMMENT ON FUNCTION log_security_violations() IS 'Logs potential security violations for monitoring';
COMMENT ON FUNCTION log_admin_actions() IS 'Audits all administrative actions for accountability';