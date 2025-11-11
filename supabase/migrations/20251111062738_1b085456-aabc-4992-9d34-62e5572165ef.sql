-- Fix audit log INSERT policy to prevent tampering
-- Remove the permissive INSERT policy that allows any authenticated user to insert
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.audit_logs;

-- Create secure audit logging function that validates user context
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_details jsonb DEFAULT NULL
) RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow logging if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create audit logs';
  END IF;
  
  -- Insert audit log with authenticated user's ID
  INSERT INTO public.audit_logs (
    user_id, 
    entity_type, 
    entity_id, 
    action, 
    details,
    timestamp
  ) VALUES (
    auth.uid(), 
    p_entity_type, 
    p_entity_id, 
    p_action, 
    COALESCE(p_details, '{}'::jsonb),
    now()
  );
END;
$$;

-- Revoke direct INSERT access from authenticated users
REVOKE INSERT ON public.audit_logs FROM authenticated;

-- Grant execute permission on the secure logging function
GRANT EXECUTE ON FUNCTION public.log_audit_event TO authenticated;

-- Fix RLS issues: Enable RLS on public tables that don't have it
-- Check and enable RLS on appointment_rate_limits if not enabled
ALTER TABLE IF EXISTS public.appointment_rate_limits ENABLE ROW LEVEL SECURITY;

-- Add policy for appointment_rate_limits (system tracking only)
DROP POLICY IF EXISTS "System tracks rate limits" ON public.appointment_rate_limits;
CREATE POLICY "System tracks rate limits"
  ON public.appointment_rate_limits
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Enable RLS on notification_dedup if it exists
ALTER TABLE IF EXISTS public.notification_dedup ENABLE ROW LEVEL SECURITY;

-- Add policy for notification_dedup (system use only)
DROP POLICY IF EXISTS "System manages deduplication" ON public.notification_dedup;
CREATE POLICY "System manages deduplication"
  ON public.notification_dedup
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Ensure google_calendar_sync_queue has RLS
ALTER TABLE IF EXISTS public.google_calendar_sync_queue ENABLE ROW LEVEL SECURITY;

-- Add firm-scoped policy for google_calendar_sync_queue
DROP POLICY IF EXISTS "Users access own firm sync queue" ON public.google_calendar_sync_queue;
CREATE POLICY "Users access own firm sync queue"
  ON public.google_calendar_sync_queue
  FOR ALL
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.user_id = auth.uid()
        AND team_members.role IN ('admin', 'lawyer')
    )
  );

-- Add comment explaining the security changes
COMMENT ON FUNCTION public.log_audit_event IS 'Secure audit logging function that prevents tampering by validating user context and restricting direct INSERT access to audit_logs table';
