-- Add DELETE policy for contacts table
CREATE POLICY "Staff and receptionist can delete contacts" 
ON public.contacts 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1
    FROM team_members tm
    WHERE tm.user_id = auth.uid() 
    AND tm.role = ANY (ARRAY['admin'::team_role_enum, 'lawyer'::team_role_enum, 'receptionist'::team_role_enum, 'office_staff'::team_role_enum])
  )
);