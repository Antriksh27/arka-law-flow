-- Remove all problematic triggers and policies causing infinite recursion

-- Drop all the problematic triggers
DROP TRIGGER IF EXISTS prevent_profile_role_escalation ON public.profiles;
DROP TRIGGER IF EXISTS prevent_role_self_elevation_trigger ON public.profiles;
DROP TRIGGER IF EXISTS log_profiles_access ON public.profiles;

-- Drop all existing policies on profiles table and start fresh
DROP POLICY IF EXISTS "Users can view profiles in same firm" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile and team members in same firm" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile only" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_firm_members" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_manage_firm" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in their firm" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile except role" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "New users can insert their own profile" ON public.profiles;

-- Create simple, safe policies without recursion
CREATE POLICY "profiles_select_own_only"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "profiles_update_own_only"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own_only"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Admin access using team_members table only
CREATE POLICY "profiles_admin_access"
ON public.profiles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);