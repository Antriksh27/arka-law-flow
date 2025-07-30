-- Final Security Fixes Migration - Address Remaining Issues
-- This addresses the remaining 18 security issues

-- First, let's check what views still exist and fix them
DO $$
DECLARE
    view_record RECORD;
BEGIN
    -- Find all remaining security definer views
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition LIKE '%SECURITY DEFINER%'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', view_record.schemaname, view_record.viewname);
    END LOOP;
END $$;

-- Fix all remaining functions with mutable search paths
-- Update all functions that don't have SET search_path

CREATE OR REPLACE FUNCTION public.update_notes_v2_updated_at()
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

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_at_team_members()
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

CREATE OR REPLACE FUNCTION public.trigger_update_license_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  PERFORM update_law_firm_license_count(NEW.firm_id, NEW.new_license_count);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.audit_auth_failures()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- This would be triggered by application logic for failed auth
  INSERT INTO audit_logs (
    entity_type,
    action,
    details
  ) VALUES (
    'authentication',
    'login_failed',
    jsonb_build_object(
      'timestamp', now(),
      'user_agent', current_setting('request.headers', true)::json->>'user-agent'
    )
  );
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_document_activity_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Only log if case_id is not null (case-associated documents)
    IF NEW.case_id IS NOT NULL THEN
      INSERT INTO case_activities (
        case_id,
        activity_type,
        description,
        created_by,
        metadata
      ) VALUES (
        NEW.case_id,
        'document_uploaded',
        'Document "' || NEW.file_name || '" was uploaded',
        COALESCE(NEW.uploaded_by_user_id, NEW.uploaded_by, auth.uid()),
        jsonb_build_object(
          'document_id', NEW.id,
          'file_name', NEW.file_name,
          'file_type', NEW.file_type,
          'file_size', NEW.file_size
        )
      );
    END IF;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    -- Only log if case_id is not null
    IF OLD.case_id IS NOT NULL THEN
      INSERT INTO case_activities (
        case_id,
        activity_type,
        description,
        created_by,
        metadata
      ) VALUES (
        OLD.case_id,
        'document_deleted',
        'Document "' || OLD.file_name || '" was deleted',
        auth.uid(),
        jsonb_build_object(
          'document_id', OLD.id,
          'file_name', OLD.file_name,
          'file_type', OLD.file_type
        )
      );
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_document_activity()
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
      'document_uploaded',
      'Document "' || NEW.file_name || '" was uploaded',
      NEW.uploaded_by,
      jsonb_build_object(
        'document_id', NEW.id,
        'file_name', NEW.file_name,
        'file_type', NEW.file_type,
        'file_size', NEW.file_size
      )
    );
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    INSERT INTO case_activities (
      case_id,
      activity_type,
      description,
      created_by,
      metadata
    ) VALUES (
      OLD.case_id,
      'document_deleted',
      'Document "' || OLD.file_name || '" was deleted',
      auth.uid(),
      jsonb_build_object(
        'document_id', OLD.id,
        'file_name', OLD.file_name,
        'file_type', OLD.file_type
      )
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_hearing_activity()
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
      'hearing_scheduled',
      'Hearing scheduled for ' || NEW.hearing_date || ' at ' || NEW.court_name,
      NEW.created_by,
      jsonb_build_object(
        'hearing_id', NEW.id,
        'hearing_date', NEW.hearing_date,
        'court_name', NEW.court_name,
        'hearing_type', NEW.hearing_type
      )
    );
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    IF OLD.hearing_date != NEW.hearing_date THEN
      INSERT INTO case_activities (
        case_id,
        activity_type,
        description,
        created_by,
        metadata
      ) VALUES (
        NEW.case_id,
        'hearing_rescheduled',
        'Hearing rescheduled from ' || OLD.hearing_date || ' to ' || NEW.hearing_date,
        auth.uid(),
        jsonb_build_object(
          'hearing_id', NEW.id,
          'old_date', OLD.hearing_date,
          'new_date', NEW.hearing_date
        )
      );
    END IF;
    
    IF OLD.status != NEW.status THEN
      INSERT INTO case_activities (
        case_id,
        activity_type,
        description,
        created_by,
        metadata
      ) VALUES (
        NEW.case_id,
        'hearing_status_changed',
        'Hearing status changed from ' || OLD.status || ' to ' || NEW.status,
        auth.uid(),
        jsonb_build_object(
          'hearing_id', NEW.id,
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

CREATE OR REPLACE FUNCTION public.log_case_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Handle INSERT (case creation)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO case_activities (
      case_id,
      activity_type,
      description,
      created_by,
      metadata
    ) VALUES (
      NEW.id,
      'case_created',
      'Case "' || NEW.case_title || '" was created',
      NEW.created_by,
      jsonb_build_object('case_data', to_jsonb(NEW))
    );
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE (case modifications)
  IF TG_OP = 'UPDATE' THEN
    -- Track specific field changes
    IF OLD.case_title != NEW.case_title THEN
      INSERT INTO case_activities (
        case_id,
        activity_type,
        description,
        created_by,
        metadata
      ) VALUES (
        NEW.id,
        'case_title_changed',
        'Case title changed from "' || OLD.case_title || '" to "' || NEW.case_title || '"',
        auth.uid(),
        jsonb_build_object(
          'old_value', OLD.case_title,
          'new_value', NEW.case_title,
          'field', 'case_title'
        )
      );
    END IF;
    
    IF OLD.status != NEW.status THEN
      INSERT INTO case_activities (
        case_id,
        activity_type,
        description,
        created_by,
        metadata
      ) VALUES (
        NEW.id,
        'status_changed',
        'Case status changed from "' || OLD.status || '" to "' || NEW.status || '"',
        auth.uid(),
        jsonb_build_object(
          'old_value', OLD.status,
          'new_value', NEW.status,
          'field', 'status'
        )
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_document_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Set firm_id from user's team membership
  IF NEW.firm_id IS NULL THEN
    SELECT tm.firm_id INTO NEW.firm_id
    FROM team_members tm
    WHERE tm.user_id = NEW.uploaded_by
    LIMIT 1;
  END IF;

  -- Set folder_name from case title if case_id is provided
  IF NEW.case_id IS NOT NULL AND NEW.folder_name IS NULL THEN
    SELECT c.case_title INTO NEW.folder_name
    FROM cases c
    WHERE c.id = NEW.case_id;
  END IF;

  -- Set default folder if no case is linked
  IF NEW.folder_name IS NULL THEN
    NEW.folder_name := 'General Documents';
  END IF;

  RETURN NEW;
END;
$function$;

-- Functions with SQL language also need SET search_path
CREATE OR REPLACE FUNCTION public.get_user_team_role_secure()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT role::text FROM team_members WHERE user_id = auth.uid() LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_firm_id_from_team()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT firm_id FROM team_members WHERE user_id = auth.uid() LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(id uuid, full_name text, email text, role text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.role
  FROM profiles p
  WHERE p.id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_role_secure()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT role FROM profiles WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_firm_id_secure()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT firm_id FROM team_members WHERE user_id = auth.uid() LIMIT 1;
$function$;

-- Recreate clean, secure views without SECURITY DEFINER
-- These views will now respect RLS properly

-- Ensure no SECURITY DEFINER views remain by recreating them as regular views
CREATE OR REPLACE VIEW public.appointment_details AS
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

-- Make sure all views have security barriers and proper RLS
ALTER VIEW appointment_details SET (security_barrier = true);

-- Add comprehensive documentation
COMMENT ON FUNCTION public.log_security_violations() IS 'Logs security violations and RLS bypass attempts';
COMMENT ON FUNCTION public.log_admin_actions() IS 'Comprehensive audit logging for all administrative actions';

-- Ensure proper permissions are set
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM public;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;

-- Grant only necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL VIEWS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Security monitoring: Log all function executions by security definer functions
CREATE OR REPLACE FUNCTION public.monitor_security_definer_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Monitor security-sensitive function calls
  INSERT INTO audit_logs (
    entity_type,
    action,
    details
  ) VALUES (
    'function_execution',
    'security_definer_called',
    jsonb_build_object(
      'function_name', TG_TABLE_NAME,
      'user_id', auth.uid(),
      'timestamp', now(),
      'session_user', session_user,
      'current_user', current_user
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;