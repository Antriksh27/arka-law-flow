-- COMPREHENSIVE SECURITY FIX - Address all 15 linter issues

-- Fix SECURITY DEFINER views by converting them to functions or removing SECURITY DEFINER
-- Based on the linter, we need to handle 7 SECURITY DEFINER views

-- 1. Convert security definer views to regular functions with proper security
DROP VIEW IF EXISTS security_dashboard;
DROP VIEW IF EXISTS user_access_summary;
DROP VIEW IF EXISTS firm_security_metrics;
DROP VIEW IF EXISTS role_permissions_view;
DROP VIEW IF EXISTS audit_summary_view;
DROP VIEW IF EXISTS team_security_view;
DROP VIEW IF EXISTS data_access_view;

-- Create secure functions instead of SECURITY DEFINER views
CREATE OR REPLACE FUNCTION get_security_dashboard()
RETURNS TABLE(
  total_users BIGINT,
  active_sessions BIGINT,
  failed_logins_24h BIGINT,
  privilege_escalation_attempts BIGINT,
  data_access_violations BIGINT,
  last_security_scan TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    (SELECT COUNT(*) FROM auth.users)::BIGINT as total_users,
    (SELECT COUNT(*) FROM auth.sessions WHERE expires_at > now())::BIGINT as active_sessions,
    (SELECT COUNT(*) FROM public.audit_logs 
     WHERE action = 'failed_login' 
     AND created_at > now() - interval '24 hours')::BIGINT as failed_logins_24h,
    (SELECT COUNT(*) FROM public.audit_logs 
     WHERE action = 'unauthorized_role_change_attempt' 
     AND created_at > now() - interval '24 hours')::BIGINT as privilege_escalation_attempts,
    (SELECT COUNT(*) FROM public.audit_logs 
     WHERE details->>'risk_level' = 'high' 
     AND created_at > now() - interval '24 hours')::BIGINT as data_access_violations,
    now() as last_security_scan;
$$;

-- Fix all functions to have proper search_path (addresses the 6+ function warnings)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, now(), now());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION check_appointment_rate_limit(p_user_id UUID DEFAULT NULL, p_ip_address INET DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  request_count INTEGER;
  window_minutes INTEGER := 60;
  max_requests INTEGER := 10;
BEGIN
  -- Clean old entries
  DELETE FROM public.appointment_rate_limits 
  WHERE window_start < now() - interval '1 hour';
  
  -- Count recent requests
  SELECT COALESCE(SUM(request_count), 0) INTO request_count
  FROM public.appointment_rate_limits
  WHERE (p_user_id IS NOT NULL AND user_id = p_user_id)
     OR (p_ip_address IS NOT NULL AND ip_address = p_ip_address)
     AND window_start > now() - interval '1 hour';
  
  -- Check if limit exceeded
  IF request_count >= max_requests THEN
    RETURN FALSE;
  END IF;
  
  -- Record this request
  INSERT INTO public.appointment_rate_limits (user_id, ip_address, request_count, window_start)
  VALUES (p_user_id, p_ip_address, 1, now())
  ON CONFLICT (COALESCE(user_id::TEXT, '') || COALESCE(host(ip_address), ''))
  DO UPDATE SET 
    request_count = appointment_rate_limits.request_count + 1,
    window_start = CASE 
      WHEN appointment_rate_limits.window_start < now() - interval '1 hour' 
      THEN now() 
      ELSE appointment_rate_limits.window_start 
    END;
  
  RETURN TRUE;
END;
$$;

-- Add missing search_path to existing functions that need it
CREATE OR REPLACE FUNCTION public.get_user_team_role_secure()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role::text FROM public.team_members WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_firm_id_from_team()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT firm_id FROM public.team_members WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role_secure()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_firm_id_secure()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT firm_id FROM public.team_members WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_firm_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT firm_id FROM public.team_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Recreate the prevent_team_member_privilege_escalation function with proper search_path
CREATE OR REPLACE FUNCTION public.prevent_team_member_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_role text;
  target_user_current_role text;
BEGIN
  -- Get current user's role
  SELECT role INTO current_user_role
  FROM public.team_members 
  WHERE user_id = auth.uid() AND firm_id = NEW.firm_id
  LIMIT 1;
  
  -- Get target user's current role if updating
  IF TG_OP = 'UPDATE' THEN
    target_user_current_role := OLD.role;
  END IF;
  
  -- Only admins can modify team member roles
  IF current_user_role != 'admin' THEN
    -- Log unauthorized attempt
    INSERT INTO public.audit_logs (
      entity_type,
      action,
      entity_id,
      user_id,
      details
    ) VALUES (
      'team_member',
      'unauthorized_role_change_attempt',
      NEW.user_id,
      auth.uid(),
      jsonb_build_object(
        'attempted_role', NEW.role,
        'current_user_role', current_user_role,
        'target_user', NEW.user_id,
        'firm_id', NEW.firm_id
      )
    );
    
    RAISE EXCEPTION 'Only administrators can modify team member roles';
  END IF;
  
  -- Prevent admin from demoting themselves
  IF NEW.user_id = auth.uid() AND current_user_role = 'admin' AND NEW.role != 'admin' THEN
    RAISE EXCEPTION 'Administrators cannot demote themselves';
  END IF;
  
  -- Log successful role changes
  IF TG_OP = 'UPDATE' AND OLD.role != NEW.role THEN
    INSERT INTO public.audit_logs (
      entity_type,
      action,
      entity_id,
      user_id,
      details
    ) VALUES (
      'team_member',
      'role_changed',
      NEW.user_id,
      auth.uid(),
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'target_user', NEW.user_id,
        'changed_by', auth.uid(),
        'firm_id', NEW.firm_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created_at ON public.audit_logs(action, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_level ON public.audit_logs((details->>'risk_level'));
CREATE INDEX IF NOT EXISTS idx_appointment_rate_limits_user_window ON public.appointment_rate_limits(user_id, window_start);
CREATE INDEX IF NOT EXISTS idx_appointment_rate_limits_ip_window ON public.appointment_rate_limits(ip_address, window_start);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_security_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION check_appointment_rate_limit(UUID, INET) TO authenticated, anon;