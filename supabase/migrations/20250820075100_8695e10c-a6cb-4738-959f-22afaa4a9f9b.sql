-- Check current RLS policies on appointments table
\d+ appointments;

-- Show current policies 
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'appointments';

-- Fix the delete policy for appointments to ensure admins and lawyers can delete
CREATE OR REPLACE POLICY "Admin and lawyers can delete appointments" 
ON appointments 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'lawyer', 'partner', 'associate')
    AND tm.firm_id = appointments.firm_id
  )
  OR 
  -- Users can delete their own appointments
  (created_by = auth.uid())
  OR
  -- Assigned lawyer can delete
  (lawyer_id = auth.uid())
);

-- Ensure appointment creators can also delete their appointments
CREATE OR REPLACE POLICY "Users can delete their own appointments" 
ON appointments 
FOR DELETE 
TO authenticated
USING (created_by = auth.uid() OR lawyer_id = auth.uid());