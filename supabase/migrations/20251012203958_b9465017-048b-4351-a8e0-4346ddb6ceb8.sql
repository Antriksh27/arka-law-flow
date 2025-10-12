-- Allow authorized users to update case contacts
CREATE POLICY "Authorized users can update case contacts"
ON public.case_contacts
FOR UPDATE
USING (
  case_id IN (
    SELECT c.id
    FROM cases c
    JOIN team_members tm ON tm.firm_id = c.firm_id
    WHERE tm.user_id = auth.uid()
      AND tm.role = ANY (ARRAY['admin'::team_role_enum, 'lawyer'::team_role_enum, 'office_staff'::team_role_enum])
  )
)
WITH CHECK (
  case_id IN (
    SELECT c.id
    FROM cases c
    JOIN team_members tm ON tm.firm_id = c.firm_id
    WHERE tm.user_id = auth.uid()
      AND tm.role = ANY (ARRAY['admin'::team_role_enum, 'lawyer'::team_role_enum, 'office_staff'::team_role_enum])
  )
);
