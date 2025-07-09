-- First, drop all existing RLS policies on appointments table
DROP POLICY IF EXISTS "Admin can delete appointments" ON appointments;
DROP POLICY IF EXISTS "Admins and lawyers can delete appointments" ON appointments;
DROP POLICY IF EXISTS "Clients can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Staff and receptionist can create appointments" ON appointments;
DROP POLICY IF EXISTS "Staff and receptionist can update appointments" ON appointments;
DROP POLICY IF EXISTS "Staff and receptionist can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Staff can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Users can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update appointments" ON appointments;
DROP POLICY IF EXISTS "Users can view appointments they created" ON appointments;
DROP POLICY IF EXISTS "Users can view firm appointments" ON appointments;

-- Create clean, non-conflicting RLS policies
-- Allow firm members to view all appointments in their firm
CREATE POLICY "Firm members can view appointments" ON appointments
FOR SELECT
USING (
  firm_id IN (
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid()
  )
);

-- Allow staff roles to create appointments
CREATE POLICY "Staff can create appointments" ON appointments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'lawyer', 'receptionist', 'paralegal', 'office_staff')
  )
);

-- Allow staff roles to update appointments
CREATE POLICY "Staff can update appointments" ON appointments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'lawyer', 'receptionist', 'paralegal', 'office_staff')
  )
);

-- Allow admin and lawyers to delete appointments
CREATE POLICY "Admin and lawyers can delete appointments" ON appointments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'lawyer')
  )
);