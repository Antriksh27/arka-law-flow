
-- Drop all existing RLS policies on team_members to avoid conflicts.
DROP POLICY IF EXISTS "Users can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can create their own join request" ON public.team_members;
DROP POLICY IF EXISTS "Admins can update team members" ON public.team_members;
DROP POLICY IF EXISTS "Admins can delete team members" ON public.team_members;

-- Drop helper function in case it exists from a previous attempt
DROP FUNCTION IF EXISTS public.get_current_user_role_for_firm(p_firm_id uuid);

-- Re-create the function to get current user's firm ID, but prevent recursion.
-- By setting an empty search_path, we prevent the function from re-triggering the policy.
CREATE OR REPLACE FUNCTION public.get_current_user_firm_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT firm_id FROM public.team_members WHERE user_id = auth.uid() LIMIT 1;
$function$;


-- Helper function to get the current user's role within a specific firm.
-- This is also safe from recursion.
CREATE OR REPLACE FUNCTION public.get_current_user_role_for_firm(p_firm_id uuid)
RETURNS text AS $$
  SELECT role::text FROM public.team_members WHERE user_id = auth.uid() AND firm_id = p_firm_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';


-- Enable Row Level Security if it's not already.
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 1. SELECT Policy
-- Users can see their own team member record (even before approval).
-- Once approved, they can see all members of their firm.
CREATE POLICY "Users can view team members"
ON public.team_members FOR SELECT
USING (
  (user_id = auth.uid()) OR (firm_id = public.get_current_user_firm_id())
);

-- 2. INSERT Policy
-- Any authenticated user can create a join request for themselves.
CREATE POLICY "Users can create their own join request"
ON public.team_members FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 3. UPDATE Policy
-- Only admins of a firm can update member details (like changing a role or status).
CREATE POLICY "Admins can update team members"
ON public.team_members FOR UPDATE
USING (public.get_current_user_role_for_firm(firm_id) = 'admin');

-- 4. DELETE Policy
-- Only admins of a firm can remove a team member.
CREATE POLICY "Admins can delete team members"
ON public.team_members FOR DELETE
USING (public.get_current_user_role_for_firm(firm_id) = 'admin');
