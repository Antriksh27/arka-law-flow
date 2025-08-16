-- CRITICAL SECURITY FIX: Remove public access to sensitive client data in public_appointments table

-- Drop the dangerous public access policy
DROP POLICY IF EXISTS "Public appointments are viewable by all" ON public.public_appointments;

-- Remove duplicate/conflicting policies for clarity
DROP POLICY IF EXISTS "public_appointments_authenticated_view" ON public.public_appointments;
DROP POLICY IF EXISTS "Authenticated users can view appointment requests" ON public.public_appointments;
DROP POLICY IF EXISTS "Authenticated users can create appointments" ON public.public_appointments;
DROP POLICY IF EXISTS "public_appointments_create_authenticated" ON public.public_appointments;
DROP POLICY IF EXISTS "Authenticated users can update appointment requests" ON public.public_appointments;
DROP POLICY IF EXISTS "Allow public appointment creation for booking" ON public.public_appointments;
DROP POLICY IF EXISTS "Anyone can create appointment requests" ON public.public_appointments;

-- Create secure, firm-based access policies

-- Allow booking process to create appointments (required for public booking functionality)
CREATE POLICY "Enable public booking creation"
ON public.public_appointments
FOR INSERT
TO public
WITH CHECK (true);

-- Only firm members can view appointments for their firm (SECURE ACCESS)
CREATE POLICY "Firm members view firm appointments only"
ON public.public_appointments
FOR SELECT
TO public
USING (
  firm_id IN (
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid()
  )
);

-- Add audit logging for security fix
INSERT INTO audit_logs (
  entity_type,
  action,
  details
) VALUES (
  'security',
  'critical_vulnerability_fixed',
  jsonb_build_object(
    'table_name', 'public_appointments',
    'vulnerability', 'public_access_to_client_data',
    'fix_applied', 'restricted_access_to_firm_members_only',
    'timestamp', now(),
    'risk_level', 'critical'
  )
);