-- CRITICAL SECURITY FIX: Remove public access to sensitive client data in public_appointments table

-- Drop the dangerous public access policy
DROP POLICY IF EXISTS "Public appointments are viewable by all" ON public.public_appointments;

-- Remove duplicate/conflicting policies for clarity
DROP POLICY IF EXISTS "public_appointments_authenticated_view" ON public.public_appointments;
DROP POLICY IF EXISTS "Authenticated users can view appointment requests" ON public.public_appointments;
DROP POLICY IF EXISTS "Authenticated users can create appointments" ON public.public_appointments;
DROP POLICY IF EXISTS "public_appointments_create_authenticated" ON public.public_appointments;
DROP POLICY IF EXISTS "Authenticated users can update appointment requests" ON public.public_appointments;

-- Create secure, firm-based access policies

-- Only allow the booking process to create appointments (no auth required for initial booking)
CREATE POLICY "Allow public appointment creation for booking"
ON public.public_appointments
FOR INSERT
TO public
WITH CHECK (true);

-- Only firm members can view appointments for their firm
CREATE POLICY "Firm members can view their firm appointments"
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

-- Only lawyers and admins can update appointments
CREATE POLICY "Lawyers and admins can update appointments"
ON public.public_appointments
FOR UPDATE
TO public
USING (
  firm_id IN (
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'lawyer')
  )
);

-- Only admins can delete appointments
CREATE POLICY "Admins can delete appointments"
ON public.public_appointments
FOR DELETE
TO public
USING (
  firm_id IN (
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role = 'admin'
  )
);

-- Add audit logging for security monitoring
INSERT INTO audit_logs (
  entity_type,
  action,
  details
) VALUES (
  'security',
  'rls_policy_updated',
  jsonb_build_object(
    'table_name', 'public_appointments',
    'action', 'removed_public_access_vulnerability',
    'description', 'Fixed critical security issue - removed public access to sensitive client data',
    'timestamp', now(),
    'risk_level', 'critical'
  )
);