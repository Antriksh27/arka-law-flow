-- Fix hearings calendar visibility by ensuring all firm members can view all firm cases
-- This is necessary for the hearings calendar to work properly with the inner join

-- First, drop the overly restrictive policy
DROP POLICY IF EXISTS "Users can view cases they created or are assigned to" ON cases;

-- Keep the firm members policy which properly handles juniors
-- The existing policy already allows:
-- - All non-junior firm members to see all firm cases  
-- - Junior members to see only cases they're assigned to

-- Add a comment to document the policy behavior
COMMENT ON POLICY "cases_select_firm_members" ON cases IS 
'Allows firm members to view cases based on role: admins, lawyers, paralegals, and office staff can see all firm cases; juniors can only see cases they are assigned to';
