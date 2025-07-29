-- Comprehensive Security Fixes Migration
-- Addresses critical database security vulnerabilities

-- ================================================
-- PHASE 1: Fix Security Definer Functions
-- Add missing search_path security parameters
-- ================================================

-- Fix all functions missing SET search_path = 'public'
CREATE OR REPLACE FUNCTION public.update_tasks_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_public_appointments_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_contacts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_instructions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_firm_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  year_val TEXT;
  next_seq_val_text TEXT;
BEGIN
  year_val := TO_CHAR(NEW.issue_date, 'YYYY');
  
  SELECT COALESCE(MAX( (REGEXP_MATCHES(invoice_number, '-' || year_val || '-(\d+)$'))[1]::integer ), 0) + 1
  INTO next_seq_val_text
  FROM public.invoices
  WHERE firm_id = NEW.firm_id
    AND invoice_number LIKE 'INV-' || year_val || '-%';
    
  IF next_seq_val_text IS NULL THEN 
    next_seq_val_text := '1';
  END IF;

  NEW.invoice_number := 'INV-' || year_val || '-' || LPAD(next_seq_val_text, 4, '0');
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_invoice_total_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    UPDATE public.invoices
    SET total_amount = (
      SELECT COALESCE(SUM(invoice_items.amount), 0.00)
      FROM public.invoice_items
      WHERE invoice_id = OLD.invoice_id
    )
    WHERE id = OLD.invoice_id;
    RETURN OLD;
  ELSE -- INSERT or UPDATE
    UPDATE public.invoices
    SET total_amount = (
      SELECT COALESCE(SUM(invoice_items.amount), 0.00)
      FROM public.invoice_items
      WHERE invoice_id = NEW.invoice_id
    )
    WHERE id = NEW.invoice_id;
    RETURN NEW;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_client_status_to_active()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_role text;
BEGIN
  -- Get the role of the user making the change
  SELECT role INTO user_role
  FROM public.team_members 
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- If the client status is 'new' and the user is office_staff, receptionist, admin, or lawyer
  -- and certain conditions are met, change status to 'active'
  IF OLD.status = 'new' AND user_role IN ('office_staff', 'receptionist', 'admin', 'lawyer') THEN
    -- Check if any significant changes were made (not just updated_at or created_at)
    IF (OLD.assigned_lawyer_id IS DISTINCT FROM NEW.assigned_lawyer_id) OR
       (OLD.address IS DISTINCT FROM NEW.address AND NEW.address IS NOT NULL AND NEW.address != '') OR
       (OLD.organization IS DISTINCT FROM NEW.organization AND NEW.organization IS NOT NULL AND NEW.organization != '') OR
       (OLD.notes IS DISTINCT FROM NEW.notes AND NEW.notes IS NOT NULL AND NEW.notes != '') THEN
      NEW.status := 'active';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_client_status_on_document_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_role text;
BEGIN
  -- Get the role of the user uploading the document
  SELECT role INTO user_role
  FROM public.team_members 
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- If a document is uploaded for a client by office staff and client status is 'new'
  IF NEW.client_id IS NOT NULL AND user_role IN ('office_staff', 'receptionist', 'admin', 'lawyer') THEN
    UPDATE public.clients 
    SET status = 'active'
    WHERE id = NEW.client_id AND status = 'new';
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_client_status_on_case_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_role text;
BEGIN
  -- Get the role of the user creating the case
  SELECT role INTO user_role
  FROM public.team_members 
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- If a case is created for a client by office staff and client status is 'new'
  IF NEW.client_id IS NOT NULL AND user_role IN ('office_staff', 'receptionist', 'admin', 'lawyer') THEN
    UPDATE public.clients 
    SET status = 'active'
    WHERE id = NEW.client_id AND status = 'new';
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_instruction_replies_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_availability_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_at_team_members()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_update_license_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  PERFORM public.update_law_firm_license_count(NEW.firm_id, NEW.new_license_count);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_client_ref()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.case_ref := 'CLT-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                  LPAD(COALESCE(
                    (SELECT COUNT(*) + 1 FROM clients 
                     WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
                    )::TEXT,
                    '1'
                  ), 4, '0');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_notes_v2_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
    COALESCE(NEW.raw_user_meta_data->>'role', 'assistant')
  );
  RETURN NEW;
END;
$function$;

-- ================================================
-- PHASE 2: Clean up conflicting RLS policies on documents table
-- Replace 11 overlapping policies with 4 clean, consolidated ones
-- ================================================

-- Drop all existing conflicting policies on documents
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON public.documents;
DROP POLICY IF EXISTS "Clients can view only their shared documents" ON public.documents;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.documents;
DROP POLICY IF EXISTS "Only lawyers, paralegals, and admin can delete documents" ON public.documents;
DROP POLICY IF EXISTS "Only lawyers, paralegals, and admin can update documents" ON public.documents;
DROP POLICY IF EXISTS "Only lawyers, paralegals, and admin can upload documents" ON public.documents;
DROP POLICY IF EXISTS "Staff can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view firm documents" ON public.documents;
DROP POLICY IF EXISTS "documents_delete_policy" ON public.documents;
DROP POLICY IF EXISTS "documents_insert_policy" ON public.documents;
DROP POLICY IF EXISTS "documents_update_policy" ON public.documents;

-- Create consolidated, secure policies for documents
CREATE POLICY "documents_select_firm_members" ON public.documents
FOR SELECT
USING (
  -- Firm members can view firm documents
  firm_id IN (
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid()
  )
  OR
  -- Clients can view their shared documents  
  (
    get_user_role(auth.uid()) = 'client' 
    AND is_shared_with_client = true 
    AND client_id = auth.uid()
  )
);

CREATE POLICY "documents_insert_authorized" ON public.documents
FOR INSERT
WITH CHECK (
  uploaded_by = auth.uid() 
  AND get_user_role(auth.uid()) IN ('lawyer', 'paralegal', 'admin', 'office_staff')
  AND firm_id IN (
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid()
  )
);

CREATE POLICY "documents_update_authorized" ON public.documents
FOR UPDATE
USING (
  (uploaded_by = auth.uid() OR get_user_role(auth.uid()) IN ('admin', 'lawyer'))
  AND firm_id IN (
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid()
  )
);

CREATE POLICY "documents_delete_authorized" ON public.documents
FOR DELETE
USING (
  (uploaded_by = auth.uid() OR get_user_role(auth.uid()) IN ('admin', 'lawyer'))
  AND firm_id IN (
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid()
  )
);

-- ================================================
-- PHASE 3: Clean up conflicting RLS policies on clients table
-- Replace 10 overlapping policies with 4 clean, consolidated ones
-- ================================================

-- Drop all existing conflicting policies on clients
DROP POLICY IF EXISTS "Admins can manage all firm clients" ON public.clients;
DROP POLICY IF EXISTS "Allow delete for admin users in same law firm" ON public.clients;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.clients;
DROP POLICY IF EXISTS "Allow read access for users in same law firm" ON public.clients;
DROP POLICY IF EXISTS "Allow update for users in same law firm" ON public.clients;
DROP POLICY IF EXISTS "Firm members can view clients" ON public.clients;
DROP POLICY IF EXISTS "Lawyers can view assigned clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete clients they created" ON public.clients;
DROP POLICY IF EXISTS "Users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update clients they created" ON public.clients;
DROP POLICY IF EXISTS "Users can view clients they created" ON public.clients;

-- Create consolidated, secure policies for clients
CREATE POLICY "clients_select_firm_members" ON public.clients
FOR SELECT
USING (
  firm_id IN (
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid()
  )
);

CREATE POLICY "clients_insert_authorized" ON public.clients
FOR INSERT
WITH CHECK (
  created_by = auth.uid() 
  AND firm_id IN (
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid()
  )
);

CREATE POLICY "clients_update_authorized" ON public.clients
FOR UPDATE
USING (
  firm_id IN (
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid()
    AND tm.role IN ('admin', 'lawyer', 'office_staff', 'receptionist')
  )
);

CREATE POLICY "clients_delete_admin_only" ON public.clients
FOR DELETE
USING (
  firm_id IN (
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid()
    AND tm.role = 'admin'
  )
);

-- ================================================
-- PHASE 4: Standardize table references in RLS policies
-- Migrate remaining law_firm_members references to team_members
-- ================================================

-- Update cases table policies to use team_members consistently
DROP POLICY IF EXISTS "Admins can delete cases" ON public.cases;
DROP POLICY IF EXISTS "Admins, lawyers and office staff can insert cases" ON public.cases;
DROP POLICY IF EXISTS "Admins, lawyers and office staff can update cases" ON public.cases;
DROP POLICY IF EXISTS "Users can view cases from their firm" ON public.cases;

-- Recreate with team_members references
CREATE POLICY "cases_delete_admin" ON public.cases
FOR DELETE
USING (
  firm_id IN (
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role = 'admin'
  )
);

CREATE POLICY "cases_insert_authorized" ON public.cases
FOR INSERT
WITH CHECK (
  firm_id IN (
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'lawyer', 'office_staff')
  )
);

CREATE POLICY "cases_update_authorized" ON public.cases
FOR UPDATE
USING (
  firm_id IN (
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'lawyer', 'office_staff')
  )
  OR (auth.uid() = created_by)
  OR (auth.uid() = assigned_to)
);

CREATE POLICY "cases_select_firm_members" ON public.cases
FOR SELECT
USING (
  firm_id IN (
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid()
  )
  OR (auth.uid() = created_by)
  OR (auth.uid() = assigned_to)
);

-- ================================================
-- PHASE 5: Create security monitoring triggers
-- Add comprehensive audit logging for sensitive operations
-- ================================================

-- Create trigger for document access monitoring
CREATE OR REPLACE FUNCTION public.audit_document_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Log document access for sensitive documents
  IF NEW.confidential = true OR NEW.is_evidence = true THEN
    INSERT INTO audit_logs (
      entity_type,
      action,
      entity_id,
      user_id,
      details
    ) VALUES (
      'document',
      'access_sensitive',
      NEW.id,
      auth.uid(),
      jsonb_build_object(
        'file_name', NEW.file_name,
        'confidential', NEW.confidential,
        'is_evidence', NEW.is_evidence,
        'case_id', NEW.case_id,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for failed authentication attempts
CREATE OR REPLACE FUNCTION public.audit_auth_failures()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- This would be triggered by application logic for failed auth
  INSERT INTO audit_logs (
    entity_type,
    action,
    details
  ) VALUES (
    'authentication',
    'login_failed',
    jsonb_build_object(
      'timestamp', now(),
      'user_agent', current_setting('request.headers', true)::json->>'user-agent'
    )
  );
  
  RETURN NEW;
END;
$function$;