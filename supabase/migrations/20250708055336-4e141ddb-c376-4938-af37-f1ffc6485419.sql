-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Admins can insert team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view team members in their firm" ON public.team_members;

-- Create non-recursive policies using the existing security definer function
CREATE POLICY "Admins can insert team members" 
ON public.team_members 
FOR INSERT 
WITH CHECK (
  firm_id = public.get_current_user_firm_id()
  AND (
    SELECT role FROM public.team_members 
    WHERE user_id = auth.uid() 
    AND firm_id = public.get_current_user_firm_id()
  ) = 'admin'
);

-- Use the simpler existing policy approach that works
CREATE POLICY "Users can view team members in their firm" 
ON public.team_members 
FOR SELECT 
USING (firm_id = public.get_current_user_firm_id());