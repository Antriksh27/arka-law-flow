-- Fix infinite recursion by removing all problematic triggers and functions
DROP TRIGGER IF EXISTS monitor_security_threats ON audit_logs;
DROP TRIGGER IF EXISTS detect_security_threats_trigger ON audit_logs;
DROP TRIGGER IF EXISTS log_security_access_attempts_trigger ON audit_logs;
DROP TRIGGER IF EXISTS audit_role_changes_trigger ON team_members;
DROP TRIGGER IF EXISTS prevent_team_member_privilege_escalation_trigger ON team_members;

-- Drop the problematic function with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS detect_security_threats() CASCADE;
DROP FUNCTION IF EXISTS log_security_access_attempts() CASCADE;
DROP FUNCTION IF EXISTS audit_role_changes() CASCADE;
DROP FUNCTION IF EXISTS prevent_team_member_privilege_escalation() CASCADE;

-- Update Chitrajeet's role now that the problematic triggers are removed
UPDATE team_members 
SET role = 'admin'::team_role_enum, updated_at = now()
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email ILIKE '%chitrajeet%' OR email ILIKE '%upadhyaya%'
) AND role != 'admin';