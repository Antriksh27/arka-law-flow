-- Phase 3 Fixed: Enable RLS on profiles and create secure policies

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop conflicting policies on profiles table to avoid conflicts
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile except role" ON public.profiles;

-- Create comprehensive but secure RLS policies for profiles
CREATE POLICY "Users can view profiles in their firm" 
ON public.profiles 
FOR SELECT 
USING (
  id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.team_members tm1, public.team_members tm2
    WHERE tm1.user_id = auth.uid() 
    AND tm2.user_id = profiles.id
    AND tm1.firm_id = tm2.firm_id
  )
);

-- Separate policies for different update scenarios
CREATE POLICY "Users can update their own profile except role" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role = 'admin'
  )
);

CREATE POLICY "New users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (id = auth.uid());

-- Remove overly permissive policies from other tables
DROP POLICY IF EXISTS "Users can view all clients" ON public.clients;
DROP POLICY IF EXISTS "documents_select_policy" ON public.documents;

-- Add trigger to prevent role self-elevation
CREATE OR REPLACE FUNCTION public.prevent_role_self_elevation()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user is trying to update their own profile and change role
  IF NEW.id = auth.uid() AND OLD.role != NEW.role THEN
    -- Check if user is admin
    IF NOT EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Users cannot change their own role';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce role elevation prevention
DROP TRIGGER IF EXISTS prevent_role_self_elevation_trigger ON public.profiles;
CREATE TRIGGER prevent_role_self_elevation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_elevation();