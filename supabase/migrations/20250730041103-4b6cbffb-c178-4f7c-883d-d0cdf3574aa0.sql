-- Final Security Fixes Migration - Corrected Version
-- This addresses the remaining security issues with proper syntax

-- Fix all remaining functions with mutable search paths
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
  PERFORM public.update_law_firm_license_count(NEW.firm_id, NEW.new_license_count);
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
  INSERT INTO public.audit_logs (
    entity_type,
    action,
    details
  ) VALUES (
    'authentication',
    'login_failed',
    jsonb_build_object(
      'timestamp', now()
    )
  );
  
  RETURN NEW;
END;
$function$;

-- Update SQL functions to include proper search path
CREATE OR REPLACE FUNCTION public.get_user_team_role_secure()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT role::text FROM public.team_members WHERE user_id = auth.uid() LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_firm_id_from_team()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT firm_id FROM public.team_members WHERE user_id = auth.uid() LIMIT 1;
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
  FROM public.profiles p
  WHERE p.id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_role_secure()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_firm_id_secure()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT firm_id FROM public.team_members WHERE user_id = auth.uid() LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin_in_firm()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
    AND firm_id = public.get_current_user_firm_id()
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_firm_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT firm_id FROM public.team_members WHERE user_id = auth.uid() LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_role_for_firm(p_firm_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT role::text FROM public.team_members WHERE user_id = auth.uid() AND firm_id = p_firm_id;
$function$;

CREATE OR REPLACE FUNCTION public.is_current_user_active_member()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.team_members WHERE user_id = auth.uid() AND status = 'active');
$function$;

CREATE OR REPLACE FUNCTION public.client_has_case_access(case_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.cases
    JOIN public.profiles ON profiles.id = auth.uid() AND profiles.role = 'client'
    WHERE cases.id = case_id
    AND cases.client_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_case_access(case_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT public.is_admin_or_lawyer()
  OR
  EXISTS (
    SELECT 1 
    FROM public.hearings
    WHERE hearings.case_id = case_id
    AND hearings.assigned_to = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_or_lawyer()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT role IN ('admin', 'lawyer', 'partner', 'associate') 
  FROM public.profiles 
  WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.can_view_task(user_id uuid, task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  WITH task_info AS (
    SELECT t.assigned_to, t.matter_id
    FROM public.tasks t
    WHERE t.id = task_id
  )
  SELECT 
    EXISTS (SELECT 1 FROM task_info WHERE assigned_to = user_id)
    OR
    public.is_admin(user_id)
    OR
    public.is_lawyer(user_id)
    OR
    public.is_task_creator(user_id, task_id);
$function$;

CREATE OR REPLACE FUNCTION public.can_edit_task(user_id uuid, task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT 
    public.is_task_creator(user_id, task_id)
    OR
    public.is_admin(user_id);
$function$;

CREATE OR REPLACE FUNCTION public.can_cancel_invoice(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT public.get_user_role(user_id) = 'admin';
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

CREATE OR REPLACE FUNCTION public.is_assigned_to_hearing(hearing_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT assigned_to = auth.uid() 
  FROM public.hearings
  WHERE id = hearing_id;
$function$;

CREATE OR REPLACE FUNCTION public.is_task_creator(user_id uuid, task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT created_by = user_id FROM public.tasks WHERE id = task_id;
$function$;

-- Security monitoring function
CREATE OR REPLACE FUNCTION public.monitor_security_definer_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.audit_logs (
    entity_type,
    action,
    details
  ) VALUES (
    'function_execution',
    'security_definer_called',
    jsonb_build_object(
      'function_name', TG_TABLE_NAME,
      'user_id', auth.uid(),
      'timestamp', now()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Add comprehensive documentation
COMMENT ON FUNCTION public.monitor_security_definer_usage() IS 'Monitors security definer function usage for audit purposes';