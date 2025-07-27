-- Phase 5: Fix Critical RLS Infinite Recursion Issues

-- Create security definer functions to prevent infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.get_user_team_role_secure()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT role::text FROM public.team_members WHERE user_id = auth.uid() LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_firm_id_from_team()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT firm_id FROM public.team_members WHERE user_id = auth.uid() LIMIT 1;
$function$;

-- Fix the team_members table RLS policies to prevent infinite recursion
DROP POLICY IF EXISTS "Team members can view other members in same firm" ON public.team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view their own team membership" ON public.team_members;

-- Create secure policies using the security definer functions
CREATE POLICY "Users can view their own team membership"
ON public.team_members
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Firm members can view team members in same firm"
ON public.team_members
FOR SELECT
USING (firm_id = public.get_user_firm_id_from_team());

CREATE POLICY "Admins can manage team members"
ON public.team_members
FOR ALL
USING (public.get_user_team_role_secure() = 'admin');

CREATE POLICY "Team members can insert with proper firm_id"
ON public.team_members
FOR INSERT
WITH CHECK (
  public.get_user_team_role_secure() = 'admin' 
  AND firm_id = public.get_user_firm_id_from_team()
);

-- Fix remaining functions with search_path issues
CREATE OR REPLACE FUNCTION public.update_notes_v2_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
SET search_path = public
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
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Secure the document activity logging function
CREATE OR REPLACE FUNCTION public.log_document_activity_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Only log if case_id is not null (case-associated documents)
    IF NEW.case_id IS NOT NULL THEN
      INSERT INTO case_activities (
        case_id,
        activity_type,
        description,
        created_by,
        metadata
      ) VALUES (
        NEW.case_id,
        'document_uploaded',
        'Document "' || NEW.file_name || '" was uploaded',
        COALESCE(NEW.uploaded_by_user_id, NEW.uploaded_by, auth.uid()),
        jsonb_build_object(
          'document_id', NEW.id,
          'file_name', NEW.file_name,
          'file_type', NEW.file_type,
          'file_size', NEW.file_size
        )
      );
    END IF;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    -- Only log if case_id is not null
    IF OLD.case_id IS NOT NULL THEN
      INSERT INTO case_activities (
        case_id,
        activity_type,
        description,
        created_by,
        metadata
      ) VALUES (
        OLD.case_id,
        'document_deleted',
        'Document "' || OLD.file_name || '" was deleted',
        auth.uid(),
        jsonb_build_object(
          'document_id', OLD.id,
          'file_name', OLD.file_name,
          'file_type', OLD.file_type
        )
      );
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;