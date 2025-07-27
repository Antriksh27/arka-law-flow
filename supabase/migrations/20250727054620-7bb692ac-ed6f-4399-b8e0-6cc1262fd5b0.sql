-- Phase 4: Fix Function Search Path Security Issues

-- Update all functions to include SET search_path = public for security
CREATE OR REPLACE FUNCTION public.update_tasks_updated_at()
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

CREATE OR REPLACE FUNCTION public.update_public_appointments_updated_at()
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

CREATE OR REPLACE FUNCTION public.update_contacts_updated_at()
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

CREATE OR REPLACE FUNCTION public.update_instructions_updated_at()
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

CREATE OR REPLACE FUNCTION public.set_document_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Set firm_id from user's law firm membership
  IF NEW.firm_id IS NULL THEN
    SELECT lfm.law_firm_id INTO NEW.firm_id
    FROM law_firm_members lfm
    WHERE lfm.user_id = NEW.uploaded_by
    LIMIT 1;
  END IF;

  -- Set folder_name from case title if case_id is provided
  IF NEW.case_id IS NOT NULL AND NEW.folder_name IS NULL THEN
    SELECT c.title INTO NEW.folder_name
    FROM cases c
    WHERE c.id = NEW.case_id;
  END IF;

  -- Set default folder if no case is linked
  IF NEW.folder_name IS NULL THEN
    NEW.folder_name := 'General Documents';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_instruction_replies_updated_at()
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

CREATE OR REPLACE FUNCTION public.update_availability_updated_at()
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

-- Update other commonly used functions to have proper search_path
CREATE OR REPLACE FUNCTION public.log_case_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Handle INSERT (case creation)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO case_activities (
      case_id,
      activity_type,
      description,
      created_by,
      metadata
    ) VALUES (
      NEW.id,
      'case_created',
      'Case "' || NEW.case_title || '" was created',
      NEW.created_by,
      jsonb_build_object('case_data', to_jsonb(NEW))
    );
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE (case modifications)
  IF TG_OP = 'UPDATE' THEN
    -- Track specific field changes
    IF OLD.case_title != NEW.case_title THEN
      INSERT INTO case_activities (
        case_id,
        activity_type,
        description,
        created_by,
        metadata
      ) VALUES (
        NEW.id,
        'case_title_changed',
        'Case title changed from "' || OLD.case_title || '" to "' || NEW.case_title || '"',
        auth.uid(),
        jsonb_build_object(
          'old_value', OLD.case_title,
          'new_value', NEW.case_title,
          'field', 'case_title'
        )
      );
    END IF;
    
    IF OLD.status != NEW.status THEN
      INSERT INTO case_activities (
        case_id,
        activity_type,
        description,
        created_by,
        metadata
      ) VALUES (
        NEW.id,
        'status_changed',
        'Case status changed from "' || OLD.status || '" to "' || NEW.status || '"',
        auth.uid(),
        jsonb_build_object(
          'old_value', OLD.status,
          'new_value', NEW.status,
          'field', 'status'
        )
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$function$;