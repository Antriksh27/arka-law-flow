-- CRITICAL SECURITY FIX: Secure google_calendar_sync_queue table from unauthorized access

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "System can manage sync queue" ON public.google_calendar_sync_queue;
DROP POLICY IF EXISTS "Users can view their own sync queue" ON public.google_calendar_sync_queue;
DROP POLICY IF EXISTS "Users can create their own sync queue items" ON public.google_calendar_sync_queue;
DROP POLICY IF EXISTS "Users can update their own sync queue items" ON public.google_calendar_sync_queue;
DROP POLICY IF EXISTS "System can delete processed items" ON public.google_calendar_sync_queue;
DROP POLICY IF EXISTS "Service role can manage sync queue" ON public.google_calendar_sync_queue;

-- Create secure, user-based access policies

-- Users can only view their own sync queue items (SECURE)
CREATE POLICY "Secure user sync queue view"
ON public.google_calendar_sync_queue
FOR SELECT
TO public
USING (user_id = auth.uid());

-- Users can only create their own sync queue items (SECURE)
CREATE POLICY "Secure user sync queue creation"
ON public.google_calendar_sync_queue
FOR INSERT
TO public
WITH CHECK (user_id = auth.uid());

-- Users can only update their own sync queue items (SECURE)
CREATE POLICY "Secure user sync queue updates"
ON public.google_calendar_sync_queue
FOR UPDATE
TO public
USING (user_id = auth.uid());

-- Edge functions need service role access for processing
CREATE POLICY "Edge function processing access"
ON public.google_calendar_sync_queue
FOR ALL
TO service_role
USING (true);

-- Add audit logging for security fix
INSERT INTO audit_logs (
  entity_type,
  action,
  details
) VALUES (
  'security',
  'critical_data_exposure_fixed',
  jsonb_build_object(
    'table_name', 'google_calendar_sync_queue',
    'vulnerability_type', 'unrestricted_public_access',
    'exposed_data', 'client_names_emails_phone_case_details',
    'fix_description', 'implemented_user_based_access_control',
    'timestamp', now(),
    'severity', 'critical'
  )
);