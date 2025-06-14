
-- Update the appointments table to match the requirements (skip existing columns)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS appointment_date DATE,
ADD COLUMN IF NOT EXISTS appointment_time TIME,
ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES law_firms(id);

-- Update existing columns to match requirements
ALTER TABLE appointments 
ALTER COLUMN start_time DROP NOT NULL,
ALTER COLUMN duration_minutes SET DEFAULT 60;

-- Add status column if it doesn't exist (using existing enum)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming';

-- Enable RLS on appointments table
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view firm appointments" ON appointments;
DROP POLICY IF EXISTS "Admins and lawyers can create appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update appointments" ON appointments;
DROP POLICY IF EXISTS "Admins and lawyers can delete appointments" ON appointments;

-- Create RLS policies for appointments

-- Policy: Users can view appointments in their firm
CREATE POLICY "Users can view firm appointments" ON appointments
FOR SELECT USING (
  firm_id IN (
    SELECT law_firm_id FROM law_firm_members WHERE user_id = auth.uid()
  )
  OR
  lawyer_id = auth.uid()
  OR
  created_by = auth.uid()
);

-- Policy: Admins and lawyers can create appointments
CREATE POLICY "Admins and lawyers can create appointments" ON appointments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'lawyer', 'paralegal')
  )
);

-- Policy: Users can update their own appointments or if they're admin/lawyer
CREATE POLICY "Users can update appointments" ON appointments
FOR UPDATE USING (
  lawyer_id = auth.uid()
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'lawyer')
  )
);

-- Policy: Admins and lawyers can delete appointments
CREATE POLICY "Admins and lawyers can delete appointments" ON appointments
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'lawyer')
  )
  OR created_by = auth.uid()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_firm_id ON appointments(firm_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_lawyer_id ON appointments(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);

-- Create a view for appointment details with related data
CREATE OR REPLACE VIEW appointment_details AS
SELECT 
  a.*,
  c.full_name as client_name,
  p.full_name as assigned_user_name,
  cases.case_title as case_title,
  cases.case_number as case_number
FROM appointments a
LEFT JOIN clients c ON a.client_id = c.id
LEFT JOIN profiles p ON a.lawyer_id = p.id
LEFT JOIN cases ON a.case_id = cases.id;
