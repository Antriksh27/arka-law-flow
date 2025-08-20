-- Check what are the valid team role enum values
SELECT enumlabel FROM pg_enum WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'team_role_enum'
);

-- Drop the existing delete policy and recreate with correct enum values
DROP POLICY IF EXISTS "Admin and lawyers can delete appointments" ON appointments;
DROP POLICY IF EXISTS "Delete appointments policy" ON appointments;

-- Create comprehensive delete policy for appointments with correct enum values
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