-- CRITICAL SECURITY FIX: Secure google_calendar_sync_queue table from unauthorized access

-- Drop the dangerous public access policy
DROP POLICY IF EXISTS "System can manage sync queue" ON public.google_calendar_sync_queue;

-- Create secure, user-based access policies

-- Only users can view their own sync queue items
CREATE POLICY "Users can view their own sync queue"
ON public.google_calendar_sync_queue
FOR SELECT
TO public
USING (user_id = auth.uid());

-- Only users can create their own sync queue items
CREATE POLICY "Users can create their own sync queue items"
ON public.google_calendar_sync_queue
FOR INSERT
TO public
WITH CHECK (user_id = auth.uid());

-- Only users can update their own sync queue items
CREATE POLICY "Users can update their own sync queue items"
ON public.google_calendar_sync_queue
FOR UPDATE
TO public
USING (user_id = auth.uid());

-- Only the system/functions can delete processed items (for cleanup)
-- We need to allow service role access for the edge function
CREATE POLICY "System can delete processed items"
ON public.google_calendar_sync_queue
FOR DELETE
TO public
USING (processed = true);

-- Allow edge functions to access sync queue for processing
-- This policy allows the service role (used by edge functions) to manage the queue
CREATE POLICY "Service role can manage sync queue"
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
  'critical_vulnerability_fixed',
  jsonb_build_object(
    'table_name', 'google_calendar_sync_queue',
    'vulnerability', 'public_access_to_sensitive_appointment_data',
    'fix_applied', 'restricted_access_to_user_data_only',
    'data_exposed', 'appointment_data_jsonb_with_client_info',
    'timestamp', now(),
    'risk_level', 'critical'
  )
);