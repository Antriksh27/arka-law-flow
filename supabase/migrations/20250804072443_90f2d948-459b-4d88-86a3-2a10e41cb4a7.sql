-- Phase 3: Data Protection Enhancement Security Migration

-- 1. Create encryption functions for PII data
CREATE OR REPLACE FUNCTION public.encrypt_pii(data text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT encode(pgp_sym_encrypt(data, current_setting('app.encryption_key', true)), 'base64');
$$;

CREATE OR REPLACE FUNCTION public.decrypt_pii(encrypted_data text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT pgp_sym_decrypt(decode(encrypted_data, 'base64'), current_setting('app.encryption_key', true));
$$;

-- 2. Add encryption columns for sensitive PII data
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS aadhaar_encrypted text,
ADD COLUMN IF NOT EXISTS phone_encrypted text,
ADD COLUMN IF NOT EXISTS address_encrypted text;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS aadhaar_encrypted text,
ADD COLUMN IF NOT EXISTS phone_encrypted text,
ADD COLUMN IF NOT EXISTS address_encrypted text;

-- 3. Create secure password generation table for temporary storage
CREATE TABLE IF NOT EXISTS public.secure_passwords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  used boolean DEFAULT false,
  expires_at timestamp with time zone DEFAULT (now() + interval '1 hour')
);

-- Enable RLS on secure_passwords
ALTER TABLE public.secure_passwords ENABLE ROW LEVEL SECURITY;

-- Only creators can access their generated passwords
CREATE POLICY "Users can view their own secure passwords" 
ON public.secure_passwords 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create secure passwords" 
ON public.secure_passwords 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- 4. Enhanced audit log security with integrity checks
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS hash_chain text,
ADD COLUMN IF NOT EXISTS previous_log_hash text,
ADD COLUMN IF NOT EXISTS ip_address inet,
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS session_id text;

-- Create audit log integrity function
CREATE OR REPLACE FUNCTION public.calculate_audit_hash(
  log_id uuid,
  entity_type text,
  action text,
  user_id uuid,
  timestamp_val timestamptz,
  previous_hash text
)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT encode(
    digest(
      COALESCE(log_id::text, '') || 
      COALESCE(entity_type, '') || 
      COALESCE(action, '') || 
      COALESCE(user_id::text, '') || 
      COALESCE(timestamp_val::text, '') ||
      COALESCE(previous_hash, ''),
      'sha256'
    ),
    'hex'
  );
$$;

-- Trigger to add hash chain to audit logs
CREATE OR REPLACE FUNCTION public.add_audit_hash_chain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  prev_hash text;
BEGIN
  -- Get the hash of the previous log entry
  SELECT hash_chain INTO prev_hash
  FROM audit_logs
  ORDER BY timestamp DESC
  LIMIT 1;
  
  -- Calculate the hash chain for this entry
  NEW.previous_log_hash := prev_hash;
  NEW.hash_chain := public.calculate_audit_hash(
    NEW.id,
    NEW.entity_type,
    NEW.action,
    NEW.user_id,
    NEW.timestamp,
    prev_hash
  );
  
  -- Add session and request metadata
  NEW.ip_address := inet_client_addr();
  NEW.session_id := current_setting('request.jwt.claims', true)::json->>'sub';
  
  RETURN NEW;
END;
$$;

-- Create trigger for audit hash chain
DROP TRIGGER IF EXISTS audit_hash_chain_trigger ON public.audit_logs;
CREATE TRIGGER audit_hash_chain_trigger
  BEFORE INSERT ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.add_audit_hash_chain();

-- 5. Enhanced document access monitoring
CREATE TABLE IF NOT EXISTS public.document_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  access_type text NOT NULL CHECK (access_type IN ('view', 'download', 'share', 'delete', 'modify')),
  ip_address inet,
  user_agent text,
  session_id text,
  case_id uuid,
  confidential boolean DEFAULT false,
  is_evidence boolean DEFAULT false,
  timestamp timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS on document access logs
ALTER TABLE public.document_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and lawyers can view access logs, users can see their own
CREATE POLICY "Admins and lawyers can view all document access logs" 
ON public.document_access_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'lawyer', 'partner', 'associate')
  )
);

CREATE POLICY "Users can view their own document access logs" 
ON public.document_access_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- System can insert access logs
CREATE POLICY "System can insert document access logs" 
ON public.document_access_logs 
FOR INSERT 
WITH CHECK (true);

-- 6. Enhanced document access auditing trigger
CREATE OR REPLACE FUNCTION public.log_document_access_detailed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log detailed document access
  INSERT INTO document_access_logs (
    document_id,
    user_id,
    access_type,
    ip_address,
    user_agent,
    session_id,
    case_id,
    confidential,
    is_evidence,
    metadata
  ) VALUES (
    NEW.id,
    auth.uid(),
    'view',
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    current_setting('request.jwt.claims', true)::json->>'sub',
    NEW.case_id,
    NEW.confidential,
    NEW.is_evidence,
    jsonb_build_object(
      'file_name', NEW.file_name,
      'file_type', NEW.file_type,
      'file_size', NEW.file_size,
      'uploaded_by', NEW.uploaded_by,
      'timestamp', now()
    )
  );
  
  -- Also log to main audit_logs for critical documents
  IF NEW.confidential = true OR NEW.is_evidence = true THEN
    INSERT INTO audit_logs (
      entity_type,
      action,
      entity_id,
      user_id,
      details
    ) VALUES (
      'sensitive_document',
      'access_attempt',
      NEW.id,
      auth.uid(),
      jsonb_build_object(
        'file_name', NEW.file_name,
        'confidential', NEW.confidential,
        'is_evidence', NEW.is_evidence,
        'case_id', NEW.case_id,
        'access_timestamp', now(),
        'risk_level', CASE 
          WHEN NEW.confidential AND NEW.is_evidence THEN 'critical'
          WHEN NEW.confidential OR NEW.is_evidence THEN 'high'
          ELSE 'medium'
        END
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for enhanced document access logging
DROP TRIGGER IF EXISTS log_document_access_detailed_trigger ON public.documents;
CREATE TRIGGER log_document_access_detailed_trigger
  AFTER INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.log_document_access_detailed();

-- 7. Create security monitoring dashboard view with enhanced metrics
CREATE OR REPLACE VIEW public.security_dashboard AS
SELECT 
  -- Access attempt metrics
  COUNT(CASE WHEN action LIKE '%_attempt' THEN 1 END) as total_access_attempts,
  COUNT(CASE WHEN action = 'unauthorized_admin_attempt' THEN 1 END) as unauthorized_admin_attempts,
  COUNT(CASE WHEN action = 'suspicious_activity_detected' THEN 1 END) as suspicious_activities,
  COUNT(CASE WHEN action = 'role_changed' THEN 1 END) as role_changes,
  
  -- Document security metrics
  COUNT(CASE WHEN entity_type = 'sensitive_document' THEN 1 END) as sensitive_document_accesses,
  COUNT(CASE WHEN entity_type = 'document' AND action = 'access_sensitive' THEN 1 END) as confidential_accesses,
  
  -- Recent activity (last 24 hours)
  COUNT(CASE WHEN timestamp > now() - interval '24 hours' THEN 1 END) as recent_activities,
  COUNT(CASE WHEN timestamp > now() - interval '1 hour' THEN 1 END) as last_hour_activities,
  
  -- Risk assessment
  CASE 
    WHEN COUNT(CASE WHEN action = 'unauthorized_admin_attempt' AND timestamp > now() - interval '1 hour' THEN 1 END) > 5 
    THEN 'critical'
    WHEN COUNT(CASE WHEN action LIKE '%_attempt' AND timestamp > now() - interval '1 hour' THEN 1 END) > 20 
    THEN 'high'
    WHEN COUNT(CASE WHEN timestamp > now() - interval '1 hour' THEN 1 END) > 50 
    THEN 'medium'
    ELSE 'low'
  END as current_risk_level,
  
  -- Latest incidents
  MAX(timestamp) as last_incident_time
FROM audit_logs
WHERE timestamp > now() - interval '7 days';

-- Grant access to security dashboard
GRANT SELECT ON public.security_dashboard TO authenticated;

-- 8. Clean up expired secure passwords automatically
CREATE OR REPLACE FUNCTION public.cleanup_expired_passwords()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM secure_passwords 
  WHERE expires_at < now() OR used = true;
END;
$$;

-- 9. Add indexes for performance on new security tables
CREATE INDEX IF NOT EXISTS idx_audit_logs_hash_chain ON audit_logs(hash_chain);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp_user ON audit_logs(timestamp, user_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_timestamp ON document_access_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_user_document ON document_access_logs(user_id, document_id);
CREATE INDEX IF NOT EXISTS idx_secure_passwords_expires ON secure_passwords(expires_at) WHERE NOT used;