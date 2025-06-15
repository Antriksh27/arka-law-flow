
-- 1. Create a helper SECURITY DEFINER function to fetch the current user's firm_id,
-- avoiding recursion when referenced in policies.

CREATE OR REPLACE FUNCTION public.get_current_user_firm_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT firm_id FROM public.team_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 2. Enable Row Level Security (if not enabled)
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 3. Allow team members of a firm to SELECT all team_members in their firm
CREATE POLICY "Team: Only see members of own firm"
  ON public.team_members
  FOR SELECT
  USING (firm_id = public.get_current_user_firm_id());

-- 4. Allow admins/lawyers to UPDATE members in their firm, matching backgrounds
DROP POLICY IF EXISTS "Team: Admin/Lawyer can update" ON public.team_members;
CREATE POLICY "Team: Admin/Lawyer can update"
  ON public.team_members
  FOR UPDATE
  USING (
    firm_id = public.get_current_user_firm_id()
    AND role IN ('admin', 'lawyer')
  );

-- 5. Allow INSERT for users into their own firm (if you want users to self-invite or for admins to add)
DROP POLICY IF EXISTS "Team: Allow insert for firm" ON public.team_members;
CREATE POLICY "Team: Allow insert for firm"
  ON public.team_members
  FOR INSERT
  WITH CHECK (firm_id = public.get_current_user_firm_id());
