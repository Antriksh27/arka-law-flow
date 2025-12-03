-- Allow authorized team members to insert client_users
CREATE POLICY "Authorized users can insert client_users"
ON public.client_users
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.role IN ('admin', 'lawyer', 'office_staff')
  )
);

-- Allow authorized team members to delete client_users
CREATE POLICY "Authorized users can delete client_users"
ON public.client_users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.role IN ('admin', 'lawyer', 'office_staff')
  )
);

-- Allow authorized team members to update client_users
CREATE POLICY "Authorized users can update client_users"
ON public.client_users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.role IN ('admin', 'lawyer', 'office_staff')
  )
);