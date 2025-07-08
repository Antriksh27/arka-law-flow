-- Drop the problematic policy that still has ambiguous references
DROP POLICY IF EXISTS "Admins can insert team members" ON public.team_members;

-- Create a security definer function to check if current user is admin in their firm
CREATE OR REPLACE FUNCTION public.is_current_user_admin_in_firm()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
    AND firm_id = public.get_current_user_firm_id()
  );
$$;

-- Create a simple non-recursive policy
CREATE POLICY "Admins can insert team members" 
ON public.team_members 
FOR INSERT 
WITH CHECK (
  firm_id = public.get_current_user_firm_id()
  AND public.is_current_user_admin_in_firm()
);