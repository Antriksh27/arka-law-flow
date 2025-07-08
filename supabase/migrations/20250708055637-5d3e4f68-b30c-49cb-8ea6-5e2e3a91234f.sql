-- Drop ALL existing problematic policies on team_members
DROP POLICY IF EXISTS "Admins can delete team members" ON public.team_members;
DROP POLICY IF EXISTS "Admins can insert team members" ON public.team_members;
DROP POLICY IF EXISTS "Admins can update team members" ON public.team_members;
DROP POLICY IF EXISTS "Super admins can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Team: Allow user to join a firm" ON public.team_members;
DROP POLICY IF EXISTS "Team: Allow users to see their own membership" ON public.team_members;
DROP POLICY IF EXISTS "Users can create their own join request" ON public.team_members;
DROP POLICY IF EXISTS "Users can update their own team member record" ON public.team_members;
DROP POLICY IF EXISTS "Users can view members in same firm" ON public.team_members;
DROP POLICY IF EXISTS "Users can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view team members in their firm" ON public.team_members;

-- Create simple, working policies that avoid infinite recursion

-- Allow users to view team members in their firm using the security definer function
CREATE POLICY "View team members in same firm" 
ON public.team_members 
FOR SELECT 
USING (firm_id = public.get_current_user_firm_id());

-- Allow users to view their own record
CREATE POLICY "View own team member record" 
ON public.team_members 
FOR SELECT 
USING (user_id = auth.uid());

-- Allow admins to do everything (using profiles table to avoid recursion)
CREATE POLICY "Admin full access" 
ON public.team_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Allow users to insert their own records (for joining firms)
CREATE POLICY "Insert own team member record" 
ON public.team_members 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Allow users to update their own records
CREATE POLICY "Update own team member record" 
ON public.team_members 
FOR UPDATE 
USING (user_id = auth.uid());