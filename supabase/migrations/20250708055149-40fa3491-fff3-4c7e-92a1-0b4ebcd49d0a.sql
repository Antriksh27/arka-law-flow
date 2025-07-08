-- Drop problematic policies that may have ambiguous column references
DROP POLICY IF EXISTS "Admins can insert team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view team members in their firm" ON public.team_members;

-- Create cleaner policies with explicit table references
CREATE POLICY "Admins can insert team members" 
ON public.team_members 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.firm_id = team_members.firm_id 
    AND tm.role = 'admin'
  )
);

CREATE POLICY "Users can view team members in their firm" 
ON public.team_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.firm_id = team_members.firm_id
  )
);