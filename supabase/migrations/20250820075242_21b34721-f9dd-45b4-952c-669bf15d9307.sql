-- Check what roles exist in the team_role_enum
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'team_role_enum'::regtype ORDER BY enumsortorder;

-- Create comprehensive delete policy for appointments with correct roles
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
    AND tm.role IN ('admin', 'lawyer', 'associate')
    AND tm.firm_id = appointments.firm_id
  )
  OR 
  -- Users can delete appointments they created
  (created_by = auth.uid())
  OR
  -- Assigned lawyer can delete their appointments
  (lawyer_id = auth.uid())
);