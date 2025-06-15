
-- Drop the existing restrictive INSERT policy on team_members
DROP POLICY IF EXISTS "Team: Allow insert for firm" ON public.team_members;

-- Create a new policy that allows a user to join a firm by inserting a record for themselves.
-- This is secure because the user_id must match the currently authenticated user's ID.
CREATE POLICY "Team: Allow user to join a firm"
  ON public.team_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
