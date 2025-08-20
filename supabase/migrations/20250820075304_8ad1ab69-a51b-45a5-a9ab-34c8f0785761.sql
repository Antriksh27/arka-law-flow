-- Get all available team roles from the enum
\dt+;

-- List all role values in team_role_enum
SELECT unnest(enum_range(NULL::team_role_enum)) as role_name;

-- Create delete policy with only the roles that exist
DROP POLICY IF EXISTS "Delete appointments policy" ON appointments;

CREATE POLICY "Delete appointments policy" 
ON appointments 
FOR DELETE 
TO authenticated
USING (
  -- Admin and lawyers can delete any appointment in their firm
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'lawyer')
    AND tm.firm_id = appointments.firm_id
  )
  OR 
  -- Users can delete appointments they created
  (created_by = auth.uid())
  OR
  -- Assigned lawyer can delete their appointments  
  (lawyer_id = auth.uid())
);