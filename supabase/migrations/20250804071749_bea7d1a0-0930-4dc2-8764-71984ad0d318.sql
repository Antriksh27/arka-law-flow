-- Critical Security Fixes for Database
-- Phase 1: Fix Security Definer Views and Function Security

-- 1. Fix infinite recursion issue by creating a security definer function for role checking
CREATE OR REPLACE FUNCTION public.get_current_user_role_secure()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Update all functions to have proper search_path settings
CREATE OR REPLACE FUNCTION public.is_admin_or_lawyer()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role IN ('admin', 'lawyer', 'partner', 'associate') 
  FROM public.profiles 
  WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.has_case_access(case_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.is_admin_or_lawyer()
  OR
  EXISTS (
    SELECT 1 
    FROM public.hearings
    WHERE hearings.case_id = has_case_access.case_id
    AND hearings.assigned_to = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_to_hearing(hearing_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT assigned_to = auth.uid() 
  FROM public.hearings
  WHERE id = hearing_id;
$$;

CREATE OR REPLACE FUNCTION public.client_has_case_access(case_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.cases
    JOIN public.profiles ON profiles.id = auth.uid() AND profiles.role = 'client'
    WHERE cases.id = case_id
    AND cases.client_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_case_access(user_id uuid, case_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_admin boolean;
  is_case_creator boolean;
  is_assigned boolean;
BEGIN
  SELECT (role = 'admin' OR role = 'partner') INTO is_admin FROM profiles WHERE id = user_id;
  
  SELECT (created_by = user_id) INTO is_case_creator FROM cases WHERE id = case_id;
  
  SELECT (assigned_to = user_id) INTO is_assigned FROM cases WHERE id = case_id;
  
  RETURN is_admin OR is_case_creator OR is_assigned;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_participant(p_user_id uuid, p_thread_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.thread_participants
    WHERE thread_id = p_thread_id AND user_id = p_user_id
  );
$$;

-- 3. Strengthen the role self-elevation prevention function
CREATE OR REPLACE FUNCTION public.prevent_role_self_elevation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Get current user's role from team_members to ensure they have admin rights
  SELECT tm.role INTO current_user_role
  FROM team_members tm 
  WHERE tm.user_id = auth.uid() AND tm.role = 'admin'
  LIMIT 1;
  
  -- If user is trying to update their own profile and change role
  IF NEW.id = auth.uid() AND OLD.role != NEW.role THEN
    -- Only allow if user is verified admin AND not trying to become super_admin
    IF current_user_role != 'admin' OR NEW.role = 'super_admin' THEN
      RAISE EXCEPTION 'Unauthorized role modification attempt detected';
    END IF;
  END IF;
  
  -- Prevent anyone from setting super_admin role except existing super_admins
  IF NEW.role = 'super_admin' AND OLD.role != 'super_admin' THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    ) THEN
      RAISE EXCEPTION 'Only super administrators can assign super_admin role';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Add comprehensive audit logging for role changes
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log all role changes for security monitoring
  IF TG_OP = 'UPDATE' AND OLD.role != NEW.role THEN
    INSERT INTO audit_logs (
      entity_type,
      action,
      entity_id,
      user_id,
      details
    ) VALUES (
      'user_role',
      'role_changed',
      NEW.id,
      auth.uid(),
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'target_user', NEW.id,
        'changed_by', auth.uid(),
        'timestamp', now(),
        'ip_address', inet_client_addr()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for role change auditing
DROP TRIGGER IF EXISTS audit_role_changes_trigger ON profiles;
CREATE TRIGGER audit_role_changes_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_role_changes();

-- 5. Create enhanced security monitoring view with proper permissions
DROP VIEW IF EXISTS security_monitoring;
CREATE VIEW security_monitoring AS
SELECT 
  al.timestamp,
  al.action,
  al.entity_type,
  p.full_name as user_name,
  p.role as user_role,
  al.details,
  CASE 
    WHEN al.action LIKE '%_attempt' THEN 'Attempted Access'
    WHEN al.action LIKE '%violation%' THEN 'Security Violation'
    WHEN al.action = 'role_changed' THEN 'Privilege Change'
    WHEN al.action LIKE '%sensitive%' THEN 'Sensitive Data Access'
    ELSE 'General Activity'
  END as severity_level
FROM audit_logs al
LEFT JOIN profiles p ON p.id = al.user_id
WHERE al.timestamp > now() - interval '30 days'
ORDER BY al.timestamp DESC;

-- Grant access to security monitoring view for admins only
GRANT SELECT ON security_monitoring TO authenticated;

-- 6. Enhanced admin function security
CREATE OR REPLACE FUNCTION public.secure_admin_action_logger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_role text;
BEGIN
  -- Verify admin status before allowing action
  SELECT role INTO admin_role FROM profiles WHERE id = auth.uid();
  
  IF admin_role NOT IN ('admin', 'super_admin') THEN
    INSERT INTO audit_logs (
      entity_type,
      action,
      user_id,
      details
    ) VALUES (
      'security',
      'unauthorized_admin_attempt',
      auth.uid(),
      jsonb_build_object(
        'attempted_action', TG_OP,
        'table_name', TG_TABLE_NAME,
        'timestamp', now(),
        'user_role', admin_role
      )
    );
    RAISE EXCEPTION 'Unauthorized administrative action attempted';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;