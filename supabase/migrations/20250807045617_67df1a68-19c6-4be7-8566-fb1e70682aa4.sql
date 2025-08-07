-- CRITICAL SECURITY FIX: Remove all Security Definer Views and fix remaining functions
-- Phase 1: Critical Database Security Fixes

-- 1. Drop all Security Definer Views that bypass RLS
DROP VIEW IF EXISTS public._update_license_count;
DROP VIEW IF EXISTS public.appointment_details;
DROP VIEW IF EXISTS public.case_details;
DROP VIEW IF EXISTS public.client_stats;
DROP VIEW IF EXISTS public.firm_statistics;
DROP VIEW IF EXISTS public.security_dashboard;
DROP VIEW IF EXISTS public.security_monitoring;

-- 2. Recreate views as regular views (not SECURITY DEFINER)
CREATE VIEW public.appointment_details AS
SELECT 
    a.id,
    a.title,
    a.appointment_date,
    a.appointment_time,
    a.start_time,
    a.end_time,
    a.duration_minutes,
    a.type,
    a.status,
    a.location,
    a.notes,
    a.reminder_minutes,
    a.is_visible_to_team,
    a.lawyer_id,
    a.client_id,
    a.case_id,
    a.firm_id,
    a.created_by,
    a.created_at,
    a.document_url,
    c.full_name AS client_name,
    cs.case_title,
    cs.case_number,
    p.full_name AS assigned_user_name
FROM appointments a
LEFT JOIN clients c ON a.client_id = c.id
LEFT JOIN cases cs ON a.case_id = cs.id
LEFT JOIN profiles p ON a.lawyer_id = p.id;

CREATE VIEW public.case_details AS
SELECT 
    c.id,
    c.title,
    c.case_number,
    c.case_title,
    c.status,
    c.priority,
    c.case_type,
    c.description,
    c.client_id,
    c.assigned_to,
    c.assigned_users,
    c.created_by,
    c.firm_id,
    c.created_at,
    c.updated_at,
    c.filing_date,
    c.registration_date,
    c.next_hearing_date,
    c.closing_date,
    c.cnr_number,
    c.registration_number,
    c.filing_number,
    c.court,
    c.district,
    c.category,
    c.orders,
    c.acts,
    c.petitioner,
    c.petitioner_advocate,
    c.respondent,
    c.respondent_advocate,
    c.advocate_name,
    c.coram,
    c.objection,
    c.fetch_status,
    c.fetch_message,
    c.fetched_data,
    c.is_auto_fetched,
    cl.full_name AS client_name,
    p.full_name AS created_by_name,
    COALESCE(
        (SELECT COUNT(*) FROM documents WHERE case_id = c.id),
        0
    ) AS document_count,
    COALESCE(
        (SELECT COUNT(*) FROM hearings WHERE case_id = c.id),
        0
    ) AS hearing_count,
    COALESCE(
        (SELECT COUNT(*) FROM tasks WHERE case_id = c.id),
        0
    ) AS task_count
FROM cases c
LEFT JOIN clients cl ON c.client_id = cl.id
LEFT JOIN profiles p ON c.created_by = p.id;

CREATE VIEW public.client_stats AS
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
    p.full_name AS assigned_lawyer_name,
    COALESCE(
        (SELECT COUNT(*) FROM cases cs WHERE cs.client_id = c.id AND cs.status = 'open'),
        0
    ) AS active_case_count
FROM clients c
LEFT JOIN profiles p ON c.assigned_lawyer_id = p.id;

CREATE VIEW public.firm_statistics AS
SELECT 
    lf.id AS firm_id,
    lf.name AS firm_name,
    lf.admin_email,
    lf.admin_id,
    lf.license_count,
    lf.status,
    p.full_name AS admin_name,
    p.phone AS admin_phone,
    COALESCE(
        (SELECT COUNT(*) FROM team_members tm WHERE tm.firm_id = lf.id),
        0
    ) AS total_users
FROM law_firms lf
LEFT JOIN profiles p ON lf.admin_id = p.id;

-- 3. Fix remaining functions missing search_path
CREATE OR REPLACE FUNCTION public.can_cancel_invoice(user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT get_user_role(user_id) = 'admin';
$function$;

CREATE OR REPLACE FUNCTION public.can_edit_task(user_id uuid, task_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT 
    -- User created the task
    public.is_task_creator(user_id, task_id)
    OR
    -- User is admin
    public.is_admin(user_id);
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT role FROM public.profiles WHERE id = user_id;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT role = 'admin' FROM public.profiles WHERE id = user_id;
$function$;

CREATE OR REPLACE FUNCTION public.is_lawyer(user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT role = 'lawyer' OR role = 'partner' OR role = 'associate' FROM public.profiles WHERE id = user_id;
$function$;

CREATE OR REPLACE FUNCTION public.is_task_creator(user_id uuid, task_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT created_by = user_id FROM public.tasks WHERE id = task_id;
$function$;

-- 4. Enhanced privilege escalation prevention with detailed audit logging
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  current_user_role text;
  current_user_firm uuid;
  target_firm uuid;
BEGIN
  -- Get current user's role and firm
  SELECT tm.role, tm.firm_id INTO current_user_role, current_user_firm
  FROM public.team_members tm 
  WHERE tm.user_id = auth.uid()
  LIMIT 1;
  
  -- For team_members table updates
  IF TG_TABLE_NAME = 'team_members' THEN
    target_firm := NEW.firm_id;
    
    -- Only admins can modify team member roles
    IF current_user_role != 'admin' THEN
      INSERT INTO public.audit_logs (
        entity_type, action, entity_id, user_id, details
      ) VALUES (
        'team_member', 'unauthorized_role_change_attempt', NEW.user_id, auth.uid(),
        jsonb_build_object(
          'attempted_role', NEW.role,
          'current_user_role', current_user_role,
          'target_user', NEW.user_id,
          'firm_id', NEW.firm_id,
          'risk_level', 'critical'
        )
      );
      RAISE EXCEPTION 'Only administrators can modify team member roles';
    END IF;
    
    -- Prevent admin from demoting themselves
    IF NEW.user_id = auth.uid() AND current_user_role = 'admin' AND NEW.role != 'admin' THEN
      INSERT INTO public.audit_logs (
        entity_type, action, entity_id, user_id, details
      ) VALUES (
        'team_member', 'self_demotion_attempt', NEW.user_id, auth.uid(),
        jsonb_build_object(
          'attempted_role', NEW.role,
          'current_role', 'admin',
          'risk_level', 'high'
        )
      );
      RAISE EXCEPTION 'Administrators cannot demote themselves';
    END IF;
    
    -- Must be in same firm
    IF current_user_firm != target_firm THEN
      INSERT INTO public.audit_logs (
        entity_type, action, entity_id, user_id, details
      ) VALUES (
        'team_member', 'cross_firm_modification_attempt', NEW.user_id, auth.uid(),
        jsonb_build_object(
          'user_firm', current_user_firm,
          'target_firm', target_firm,
          'risk_level', 'critical'
        )
      );
      RAISE EXCEPTION 'Cannot modify team members outside your firm';
    END IF;
  END IF;
  
  -- For profiles table updates
  IF TG_TABLE_NAME = 'profiles' THEN
    -- Prevent role escalation via profiles table
    IF OLD.role != NEW.role THEN
      INSERT INTO public.audit_logs (
        entity_type, action, entity_id, user_id, details
      ) VALUES (
        'profile', 'role_change_via_profiles_blocked', NEW.id, auth.uid(),
        jsonb_build_object(
          'old_role', OLD.role,
          'attempted_role', NEW.role,
          'risk_level', 'critical'
        )
      );
      RAISE EXCEPTION 'Role changes must be done through team_members table';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Apply privilege escalation prevention triggers
DROP TRIGGER IF EXISTS prevent_team_member_privilege_escalation ON public.team_members;
CREATE TRIGGER prevent_team_member_privilege_escalation
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_privilege_escalation();

DROP TRIGGER IF EXISTS prevent_profile_role_escalation ON public.profiles;
CREATE TRIGGER prevent_profile_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_privilege_escalation();

-- 5. Enhanced security monitoring and alerting
CREATE OR REPLACE FUNCTION public.detect_security_threats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  recent_failures integer;
  user_agent text;
  ip_address inet;
BEGIN
  -- Get request metadata
  ip_address := inet_client_addr();
  
  -- Check for rapid authentication failures
  IF NEW.action = 'login_failed' THEN
    SELECT COUNT(*) INTO recent_failures
    FROM public.audit_logs
    WHERE action = 'login_failed'
      AND timestamp > now() - interval '5 minutes'
      AND details->>'email' = NEW.details->>'email';
    
    IF recent_failures >= 5 THEN
      INSERT INTO public.audit_logs (
        entity_type, action, user_id, details
      ) VALUES (
        'security', 'brute_force_detected', NEW.user_id,
        jsonb_build_object(
          'email', NEW.details->>'email',
          'failure_count', recent_failures,
          'ip_address', ip_address,
          'risk_level', 'critical',
          'auto_detected', true
        )
      );
    END IF;
  END IF;
  
  -- Check for privilege escalation patterns
  IF NEW.action LIKE '%role%' OR NEW.action LIKE '%privilege%' THEN
    INSERT INTO public.audit_logs (
      entity_type, action, user_id, details
    ) VALUES (
      'security', 'privilege_change_monitored', NEW.user_id,
      jsonb_build_object(
        'original_action', NEW.action,
        'ip_address', ip_address,
        'risk_level', 'medium',
        'requires_review', true
      )
    );
  END IF;
  
  -- Check for suspicious access patterns
  IF NEW.action LIKE '%sensitive%' OR NEW.action LIKE '%admin%' THEN
    SELECT COUNT(*) INTO recent_failures
    FROM public.audit_logs
    WHERE user_id = NEW.user_id
      AND action LIKE '%sensitive%'
      AND timestamp > now() - interval '1 hour';
    
    IF recent_failures >= 20 THEN
      INSERT INTO public.audit_logs (
        entity_type, action, user_id, details
      ) VALUES (
        'security', 'excessive_sensitive_access', NEW.user_id,
        jsonb_build_object(
          'access_count', recent_failures,
          'timeframe', '1 hour',
          'ip_address', ip_address,
          'risk_level', 'high',
          'auto_detected', true
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Apply security monitoring trigger
DROP TRIGGER IF EXISTS monitor_security_threats ON public.audit_logs;
CREATE TRIGGER monitor_security_threats
  AFTER INSERT ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.detect_security_threats();

-- 6. Secure profiles table RLS policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create restrictive profiles policies
CREATE POLICY "Users can view own profile and team members in same firm"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.team_members tm1, public.team_members tm2
      WHERE tm1.user_id = auth.uid() 
        AND tm2.user_id = profiles.id
        AND tm1.firm_id = tm2.firm_id
    )
  );

CREATE POLICY "Users can update own profile only"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "System can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- 7. Enhanced rate limiting for appointments
CREATE OR REPLACE FUNCTION public.check_appointment_rate_limit_enhanced(p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  request_count INTEGER;
  daily_count INTEGER;
  max_hourly INTEGER := 10;
  max_daily INTEGER := 50;
  user_role TEXT;
BEGIN
  -- Get user role for different limits
  SELECT tm.role INTO user_role
  FROM public.team_members tm
  WHERE tm.user_id = p_user_id
  LIMIT 1;
  
  -- Higher limits for admin/lawyer roles
  IF user_role IN ('admin', 'lawyer') THEN
    max_hourly := 50;
    max_daily := 200;
  END IF;
  
  -- Count hourly requests
  SELECT COUNT(*) INTO request_count
  FROM public.appointment_rate_limits
  WHERE user_id = p_user_id
    AND window_start > now() - interval '1 hour';
  
  -- Count daily requests
  SELECT COUNT(*) INTO daily_count
  FROM public.appointment_rate_limits
  WHERE user_id = p_user_id
    AND window_start > now() - interval '24 hours';
  
  -- Clean up old entries
  DELETE FROM public.appointment_rate_limits
  WHERE window_start < now() - interval '48 hours';
  
  IF request_count >= max_hourly OR daily_count >= max_daily THEN
    INSERT INTO public.audit_logs (
      entity_type, action, user_id, details
    ) VALUES (
      'appointment', 'rate_limit_exceeded', p_user_id,
      jsonb_build_object(
        'hourly_count', request_count,
        'daily_count', daily_count,
        'max_hourly', max_hourly,
        'max_daily', max_daily,
        'user_role', user_role,
        'risk_level', 'medium'
      )
    );
    RETURN FALSE;
  END IF;
  
  -- Record this request
  INSERT INTO public.appointment_rate_limits (user_id, ip_address)
  VALUES (p_user_id, inet_client_addr());
  
  RETURN TRUE;
END;
$function$;

-- Add performance indexes for security monitoring
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_timestamp ON public.audit_logs(action, timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON public.audit_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_level ON public.audit_logs((details->>'risk_level'));
CREATE INDEX IF NOT EXISTS idx_appointment_rate_limits_user_window ON public.appointment_rate_limits(user_id, window_start);

-- Log the security migration completion
INSERT INTO public.audit_logs (
  entity_type, action, details
) VALUES (
  'security', 'comprehensive_security_migration_completed',
  jsonb_build_object(
    'migration_version', 'v1.0',
    'fixes_applied', jsonb_build_array(
      'removed_security_definer_views',
      'fixed_function_search_paths',
      'enhanced_privilege_escalation_prevention',
      'improved_security_monitoring',
      'secured_profiles_rls',
      'enhanced_rate_limiting'
    ),
    'timestamp', now(),
    'severity', 'info'
  )
);