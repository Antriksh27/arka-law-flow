
-- Final cleanup of team_members RLS policies to fix recursion and security.

-- 1. Drop ALL known RLS policies on team_members to ensure a clean state.
DROP POLICY IF EXISTS "Users can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can create their own join request" ON public.team_members;
DROP POLICY IF EXISTS "Admins can update team members" ON public.team_members;
DROP POLICY IF EXISTS "Admins can delete team members" ON public.team_members;
DROP POLICY IF EXISTS "Team: Only see members of own firm" ON public.team_members;
DROP POLICY IF EXISTS "Team: Firm only" ON public.team_members;
DROP POLICY IF EXISTS "Team: Admin/Lawyer can update" ON public.team_members;
DROP POLICY IF EXISTS "Team: Allow insert for firm" ON public.team_members;


-- 2. Drop old helper functions that might be causing issues.
DROP FUNCTION IF EXISTS public.get_current_user_firm_id();
DROP FUNCTION IF EXISTS public.get_current_user_role_for_firm(uuid);
DROP FUNCTION IF EXISTS public.is_current_user_active_member();


-- 3. Create non-recursive helper functions.
-- Gets the current user's firm ID.
CREATE OR REPLACE FUNCTION public.get_current_user_firm_id()
 RETURNS uuid
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT firm_id FROM public.team_members WHERE user_id = auth.uid() LIMIT 1;
$function$;

-- Gets the current user's role for a given firm.
CREATE OR REPLACE FUNCTION public.get_current_user_role_for_firm(p_firm_id uuid)
RETURNS text AS $$
  SELECT role::text FROM public.team_members WHERE user_id = auth.uid() AND firm_id = p_firm_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

-- Checks if the current user is an active member.
CREATE OR REPLACE FUNCTION public.is_current_user_active_member()
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM public.team_members WHERE user_id = auth.uid() AND status = 'active');
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';


-- 4. Re-create the definitive set of RLS policies for team_members.

-- SELECT Policy:
-- Users can always see their own record.
-- If they are an 'active' member, they can see all other members of their firm.
CREATE POLICY "Users can view team members"
ON public.team_members FOR SELECT
USING (
  (user_id = auth.uid()) OR
  (public.is_current_user_active_member() AND firm_id = public.get_current_user_firm_id())
);

-- INSERT Policy:
-- Any authenticated user can create a join request for themselves.
CREATE POLICY "Users can create their own join request"
ON public.team_members FOR INSERT
WITH CHECK (user_id = auth.uid());

-- UPDATE Policy:
-- Only admins of the firm can update member details.
CREATE POLICY "Admins can update team members"
ON public.team_members FOR UPDATE
USING (public.get_current_user_role_for_firm(firm_id) = 'admin');

-- DELETE Policy:
-- Only admins of the firm can remove a team member.
CREATE POLICY "Admins can delete team members"
ON public.team_members FOR DELETE
USING (public.get_current_user_role_for_firm(firm_id) = 'admin');
