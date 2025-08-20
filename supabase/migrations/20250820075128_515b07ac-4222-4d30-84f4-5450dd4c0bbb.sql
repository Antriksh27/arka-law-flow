-- Show current policies on appointments table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'appointments';

-- Check if there are proper delete policies and update them
DROP POLICY IF EXISTS "Admin and lawyers can delete appointments" ON appointments;

-- Create comprehensive delete policy for appointments
CREATE POLICY "Delete appointments policy" 
ON appointments 
FOR DELETE 
TO authenticated
USING (
  -- Admin and lawyers can delete any appointment in their firm
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'lawyer', 'partner', 'associate')
    AND tm.firm_id = appointments.firm_id
  )
  OR 
  -- Users can delete appointments they created
  (created_by = auth.uid())
  OR
  -- Assigned lawyer can delete their appointments
  (lawyer_id = auth.uid())
);