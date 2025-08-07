-- Fix the infinite recursion by updating functions that still reference profiles table

-- Drop the problematic trigger first
DROP TRIGGER IF EXISTS prevent_role_elevation_trigger ON public.profiles;

-- Update the prevent_role_self_elevation function to avoid recursion
CREATE OR REPLACE FUNCTION public.prevent_role_self_elevation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Get current user's role from team_members instead of profiles
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
    -- Check team_members instead of profiles to avoid recursion
    IF NOT EXISTS (
      SELECT 1 FROM team_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Only super administrators can assign super_admin role';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update get_current_user_role_secure to use team_members
CREATE OR REPLACE FUNCTION public.get_current_user_role_secure()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role::text FROM public.team_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Remove any problematic triggers that might be causing recursion
DROP TRIGGER IF EXISTS audit_role_changes_trigger ON public.profiles;
DROP TRIGGER IF EXISTS prevent_privilege_escalation_trigger ON public.profiles;