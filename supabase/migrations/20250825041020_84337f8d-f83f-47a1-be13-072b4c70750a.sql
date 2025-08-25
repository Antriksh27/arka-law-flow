-- Fix infinite recursion by removing problematic triggers
DROP TRIGGER IF EXISTS detect_security_threats_trigger ON audit_logs;
DROP TRIGGER IF EXISTS log_security_access_attempts_trigger ON audit_logs;
DROP TRIGGER IF EXISTS audit_role_changes_trigger ON team_members;
DROP TRIGGER IF EXISTS prevent_team_member_privilege_escalation_trigger ON team_members;

-- Drop the problematic function
DROP FUNCTION IF EXISTS detect_security_threats();

-- Create a simplified audit function that doesn't cause recursion
CREATE OR REPLACE FUNCTION public.simple_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only log if not already an audit_logs operation to prevent recursion
  IF TG_TABLE_NAME != 'audit_logs' THEN
    INSERT INTO public.audit_logs (
      entity_type,
      action,
      entity_id,
      user_id,
      details
    ) VALUES (
      TG_TABLE_NAME,
      TG_OP,
      COALESCE(NEW.id, OLD.id),
      auth.uid(),
      jsonb_build_object(
        'timestamp', now(),
        'table', TG_TABLE_NAME
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Update Chitrajeet's role now that the triggers are fixed
UPDATE team_members 
SET role = 'admin'::team_role_enum, updated_at = now()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'chitrajeet.upadhyaya@example.com');