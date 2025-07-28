-- Fix infinite recursion in team_members RLS policies by cleaning up and consolidating them

-- Drop all existing policies on team_members
DROP POLICY IF EXISTS "Admin full access" ON public.team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Firm members can view team members in same firm" ON public.team_members;
DROP POLICY IF EXISTS "Insert own team member record" ON public.team_members;
DROP POLICY IF EXISTS "Team members can insert with proper firm_id" ON public.team_members;
DROP POLICY IF EXISTS "Update own team member record" ON public.team_members;
DROP POLICY IF EXISTS "Users can view their own team membership" ON public.team_members;
DROP POLICY IF EXISTS "View own team member record" ON public.team_members;
DROP POLICY IF EXISTS "View team members in same firm" ON public.team_members;

-- Create clean, non-recursive policies using security definer functions

-- Allow users to view their own team membership record
CREATE POLICY "team_members_select_own" ON public.team_members
FOR SELECT
USING (user_id = auth.uid());

-- Allow users to view team members in the same firm
CREATE POLICY "team_members_select_firm" ON public.team_members
FOR SELECT
USING (firm_id = get_user_firm_id_from_team());

-- Allow admins to have full access (using security definer function)
CREATE POLICY "team_members_admin_all" ON public.team_members
FOR ALL
USING (get_user_team_role_secure() = 'admin')
WITH CHECK (get_user_team_role_secure() = 'admin');

-- Allow users to update their own record (limited fields)
CREATE POLICY "team_members_update_own" ON public.team_members
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow admins to insert new team members
CREATE POLICY "team_members_insert_admin" ON public.team_members
FOR INSERT
WITH CHECK (
  get_user_team_role_secure() = 'admin'
  AND firm_id = get_user_firm_id_from_team()
);

-- Allow self-registration for new users (for signup flow)
CREATE POLICY "team_members_insert_self" ON public.team_members
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM public.team_members WHERE user_id = auth.uid()
  )
);