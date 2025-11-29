-- Add RLS policy to allow team members to view their own firm
CREATE POLICY "Team members can view their firm"
ON law_firms
FOR SELECT
USING (
  id IN (
    SELECT firm_id FROM team_members WHERE user_id = auth.uid()
  )
);