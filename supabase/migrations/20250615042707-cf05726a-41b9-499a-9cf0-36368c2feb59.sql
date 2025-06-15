
-- This policy allows a user to read their own record from the 'team_members' table.
-- It resolves an infinite recursion error in the previous security rules,
-- which occurred when the system tried to find a user's firm ID by checking a table
-- that required the firm ID to be known already.
CREATE POLICY "Team: Allow users to see their own membership"
  ON public.team_members
  FOR SELECT
  USING (user_id = auth.uid());
