-- PHASE 1: CRITICAL SECURITY FIXES (Final Version)

-- 1. Fix Profile Data Exposure - Remove overly permissive policy
DROP POLICY IF EXISTS "Allow authenticated users to view all profiles" ON public.profiles;

-- Create firm-based profile access policy
CREATE POLICY "Users can view profiles in same firm" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id 
  OR 
  EXISTS (
    SELECT 1 FROM public.team_members tm1
    JOIN public.team_members tm2 ON tm1.firm_id = tm2.firm_id
    WHERE tm1.user_id = auth.uid() 
    AND tm2.user_id = profiles.id
    AND tm1.status = 'active'
    AND tm2.status = 'active'
  )
);

-- 2. Fix SECURITY DEFINER functions with proper search path
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

CREATE OR REPLACE FUNCTION public.get_current_user_firm_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT firm_id FROM public.team_members WHERE user_id = auth.uid() LIMIT 1;
$function$;

-- 3. Secure public appointments - Add authentication requirement
DROP POLICY IF EXISTS "Anyone can create public appointments" ON public.public_appointments;
CREATE POLICY "Authenticated users can create appointments" 
ON public.public_appointments 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Add rate limiting table for appointment creation
CREATE TABLE IF NOT EXISTS public.appointment_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  ip_address INET,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on rate limiting table
ALTER TABLE public.appointment_rate_limits ENABLE ROW LEVEL SECURITY;

-- Rate limiting policy
CREATE POLICY "Users can view own rate limits" 
ON public.appointment_rate_limits 
FOR SELECT 
USING (user_id = auth.uid());

-- 4. Enhance team member privilege escalation prevention
CREATE OR REPLACE FUNCTION public.prevent_team_member_privilege_escalation()
RETURNS TRIGGER AS $$
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
    -- Log unauthorized attempt (using existing audit_logs structure)
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
        'firm_id', NEW.firm_id,
        'risk_level', 'high'
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
        'firm_id', NEW.firm_id,
        'risk_level', 'medium'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger for team member changes
DROP TRIGGER IF EXISTS prevent_privilege_escalation_trigger ON public.team_members;
CREATE TRIGGER prevent_privilege_escalation_trigger
  BEFORE INSERT OR UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_team_member_privilege_escalation();

-- 5. Add function to check appointment rate limits
CREATE OR REPLACE FUNCTION public.check_appointment_rate_limit(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  request_count INTEGER;
  max_requests INTEGER := 10; -- Max 10 appointments per hour
  window_minutes INTEGER := 60;
BEGIN
  -- Count requests in the last hour
  SELECT COUNT(*) INTO request_count
  FROM public.appointment_rate_limits
  WHERE user_id = p_user_id
    AND window_start > now() - interval '1 hour';
  
  -- Clean up old entries
  DELETE FROM public.appointment_rate_limits
  WHERE window_start < now() - interval '24 hours';
  
  IF request_count >= max_requests THEN
    -- Log rate limit violation
    INSERT INTO public.audit_logs (
      entity_type,
      action,
      user_id,
      details
    ) VALUES (
      'appointment',
      'rate_limit_exceeded',
      p_user_id,
      jsonb_build_object(
        'request_count', request_count,
        'max_requests', max_requests,
        'time_window', window_minutes || ' minutes',
        'risk_level', 'high'
      )
    );
    
    RETURN FALSE;
  END IF;
  
  -- Record this request
  INSERT INTO public.appointment_rate_limits (user_id, ip_address)
  VALUES (p_user_id, inet_client_addr());
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 6. Create security monitoring functions
CREATE OR REPLACE FUNCTION public.get_security_metrics()
RETURNS TABLE(
  metric TEXT,
  value BIGINT,
  timeframe TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'high_risk_events'::TEXT as metric,
    COUNT(*)::BIGINT as value,
    'Last 24 hours'::TEXT as timeframe
  FROM public.audit_logs
  WHERE details->>'risk_level' = 'high' 
    AND timestamp > now() - interval '24 hours'

  UNION ALL

  SELECT
    'failed_login_attempts'::TEXT as metric,
    COUNT(*)::BIGINT as value,
    'Last 24 hours'::TEXT as timeframe
  FROM public.audit_logs
  WHERE action = 'login_failed'
    AND timestamp > now() - interval '24 hours'

  UNION ALL

  SELECT
    'privilege_escalation_attempts'::TEXT as metric,
    COUNT(*)::BIGINT as value,
    'Last 24 hours'::TEXT as timeframe
  FROM public.audit_logs
  WHERE action LIKE '%unauthorized%'
    AND timestamp > now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.get_security_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_appointment_rate_limit(UUID) TO authenticated;

-- 7. Add indexes for performance (corrected)
CREATE INDEX IF NOT EXISTS idx_audit_logs_details_gin ON public.audit_logs USING GIN (details);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_timestamp ON public.audit_logs(action, timestamp);
CREATE INDEX IF NOT EXISTS idx_appointment_rate_limits_user_window ON public.appointment_rate_limits(user_id, window_start);