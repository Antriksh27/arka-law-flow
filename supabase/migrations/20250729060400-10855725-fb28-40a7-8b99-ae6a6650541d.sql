-- Complete the remaining security fixes
-- Fix the remaining functions missing search_path security parameter

-- Fix all remaining security definer functions
CREATE OR REPLACE FUNCTION public.log_document_activity_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.log_document_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
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
      NEW.uploaded_by,
      jsonb_build_object(
        'document_id', NEW.id,
        'file_name', NEW.file_name,
        'file_type', NEW.file_type,
        'file_size', NEW.file_size
      )
    );
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
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
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_hearing_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO case_activities (
      case_id,
      activity_type,
      description,
      created_by,
      metadata
    ) VALUES (
      NEW.case_id,
      'hearing_scheduled',
      'Hearing scheduled for ' || NEW.hearing_date || ' at ' || NEW.court_name,
      NEW.created_by,
      jsonb_build_object(
        'hearing_id', NEW.id,
        'hearing_date', NEW.hearing_date,
        'court_name', NEW.court_name,
        'hearing_type', NEW.hearing_type
      )
    );
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    IF OLD.hearing_date != NEW.hearing_date THEN
      INSERT INTO case_activities (
        case_id,
        activity_type,
        description,
        created_by,
        metadata
      ) VALUES (
        NEW.case_id,
        'hearing_rescheduled',
        'Hearing rescheduled from ' || OLD.hearing_date || ' to ' || NEW.hearing_date,
        auth.uid(),
        jsonb_build_object(
          'hearing_id', NEW.id,
          'old_date', OLD.hearing_date,
          'new_date', NEW.hearing_date
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
        NEW.case_id,
        'hearing_status_changed',
        'Hearing status changed from ' || OLD.status || ' to ' || NEW.status,
        auth.uid(),
        jsonb_build_object(
          'hearing_id', NEW.id,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_task_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO case_activities (
      case_id,
      activity_type,
      description,
      created_by,
      metadata
    ) VALUES (
      NEW.case_id,
      'task_created',
      'Task "' || NEW.title || '" was created',
      NEW.created_by,
      jsonb_build_object(
        'task_id', NEW.id,
        'task_title', NEW.title,
        'assigned_to', NEW.assigned_to,
        'due_date', NEW.due_date
      )
    );
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO case_activities (
        case_id,
        activity_type,
        description,
        created_by,
        metadata
      ) VALUES (
        NEW.case_id,
        'task_status_changed',
        'Task "' || NEW.title || '" status changed from ' || OLD.status || ' to ' || NEW.status,
        auth.uid(),
        jsonb_build_object(
          'task_id', NEW.id,
          'task_title', NEW.title,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_case_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.set_document_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Set firm_id from user's team membership
  IF NEW.firm_id IS NULL THEN
    SELECT tm.firm_id INTO NEW.firm_id
    FROM team_members tm
    WHERE tm.user_id = NEW.uploaded_by
    LIMIT 1;
  END IF;

  -- Set folder_name from case title if case_id is provided
  IF NEW.case_id IS NOT NULL AND NEW.folder_name IS NULL THEN
    SELECT c.case_title INTO NEW.folder_name
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

CREATE OR REPLACE FUNCTION public.update_profile_picture(user_id uuid, profile_pic_url text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.profiles
  SET profile_pic = profile_pic_url
  WHERE id = user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_user_in_firm(user_id uuid, firm_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members WHERE user_id = $1 AND firm_id = $2
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_if_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_role TEXT;
BEGIN
  -- Use explicit schema reference and handle NULL values properly
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;
  
  -- Make the comparison explicit and handle NULL values
  RETURN COALESCE(user_role = 'super_admin', false);
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_law_firm_with_admin(firm_name text, firm_address text, admin_email text, admin_full_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  new_firm_id uuid;
  new_admin_id uuid;
BEGIN
  -- Create law firm
  INSERT INTO law_firms (name, address, admin_email, license_count, status)
  VALUES (firm_name, firm_address, admin_email, 1, 'pending')
  RETURNING id INTO new_firm_id;

  -- Create admin profile
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (auth.uid(), admin_full_name, admin_email, 'admin')
  RETURNING id INTO new_admin_id;

  -- Update law firm with admin
  UPDATE law_firms
  SET admin_id = new_admin_id
  WHERE id = new_firm_id;

  -- Create law firm member entry
  INSERT INTO law_firm_members (law_firm_id, user_id, role)
  VALUES (new_firm_id, new_admin_id, 'admin');

  RETURN new_firm_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_private_thread(p_other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_thread_id uuid;
  v_current_user_id uuid := auth.uid();
  v_firm_id uuid;
BEGIN
  -- Check if a DM thread between these two users already exists
  SELECT t.id INTO v_thread_id
  FROM message_threads t
  WHERE t.is_private = TRUE
    AND EXISTS (
      SELECT 1 FROM thread_participants tp
      WHERE tp.thread_id = t.id AND tp.user_id = v_current_user_id
    )
    AND EXISTS (
      SELECT 1 FROM thread_participants tp
      WHERE tp.thread_id = t.id AND tp.user_id = p_other_user_id
    )
    -- Make sure it's a 2-person chat
    AND (SELECT count(*) FROM thread_participants tp WHERE tp.thread_id = t.id) = 2
  LIMIT 1;

  -- If a thread exists, return its ID
  IF v_thread_id IS NOT NULL THEN
    RETURN v_thread_id;
  END IF;

  -- Get the current user's firm_id
  SELECT firm_id INTO v_firm_id
  FROM public.team_members 
  WHERE user_id = v_current_user_id
  LIMIT 1;

  -- If no firm_id is found, we cannot proceed.
  IF v_firm_id IS NULL THEN
    RAISE EXCEPTION 'Could not create thread. User is not part of any firm.';
  END IF;

  -- If no thread exists, create one
  INSERT INTO message_threads (created_by, firm_id, is_private)
  VALUES (v_current_user_id, v_firm_id, TRUE)
  RETURNING id INTO v_thread_id;
  
  -- If thread creation failed, handle it
  IF v_thread_id IS NULL THEN
    RAISE EXCEPTION 'Could not create thread for an unknown reason.';
  END IF;

  -- Add both users as participants
  INSERT INTO thread_participants (thread_id, user_id)
  VALUES (v_thread_id, v_current_user_id), (v_thread_id, p_other_user_id);

  RETURN v_thread_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_profile_by_id(user_id uuid)
RETURNS TABLE(id uuid, full_name text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name, p.role
  FROM profiles p
  WHERE p.id = user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_firms(user_id uuid)
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT firm_id FROM team_members WHERE user_id = $1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_all_lawyers_and_admin()
RETURNS TABLE(id uuid, full_name text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name, p.role
  FROM public.profiles p
  WHERE p.role IN ('lawyer', 'junior', 'admin', 'partner', 'associate', 'paralegal');
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  found_user_id UUID;
BEGIN
  -- First check auth.users table (which contains all registered users)
  SELECT id INTO found_user_id
  FROM auth.users
  WHERE email = user_email;
  
  -- If not found in auth.users, return null
  RETURN found_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'super_admin'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_super_admin_role(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.profiles
  SET role = 'super_admin'
  WHERE id = user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_law_firm_license_count(firm_id uuid, new_license_count integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.law_firms
  SET license_count = new_license_count
  WHERE id = firm_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_law_firm_status(firm_id uuid, new_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.law_firms
  SET status = new_status::firm_status
  WHERE id = firm_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.users_in_same_firm(user_id_1 uuid, user_id_2 uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Check if both users belong to any common team_members firm
  RETURN EXISTS (
    SELECT 1
    FROM team_members as m1
    JOIN team_members as m2 ON m1.firm_id = m2.firm_id
    WHERE m1.user_id = user_id_1
    AND m2.user_id = user_id_2
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_assign_to_role(assigner_id uuid, assignee_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  assigner_role text;
  assignee_role text;
BEGIN
  -- Get roles
  SELECT role INTO assigner_role FROM public.profiles WHERE id = assigner_id;
  SELECT role INTO assignee_role FROM public.profiles WHERE id = assignee_id;
  
  -- Admin and lawyers can assign to anyone
  IF assigner_role IN ('admin', 'lawyer', 'partner', 'associate') THEN
    RETURN true;
  END IF;
  
  -- Paralegal, Junior, Office Staff restrictions
  IF assigner_role IN ('paralegal', 'junior', 'staff') THEN
    -- Can only assign to same role level or lower
    IF assigner_role = 'paralegal' THEN
      RETURN assignee_role IN ('paralegal', 'junior', 'staff');
    ELSIF assigner_role = 'junior' THEN
      RETURN assignee_role IN ('junior', 'staff');
    ELSIF assigner_role = 'staff' THEN
      RETURN assignee_role = 'staff';
    ELSE
      RETURN false;
    END IF;
  END IF;
  
  RETURN false;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_username_availability(input_username text, current_user_id uuid)
RETURNS TABLE(available boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Check if username column exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'username'
  ) THEN
    -- If column doesn't exist, username is available
    RETURN QUERY SELECT true AS available;
    RETURN;
  END IF;

  -- Check if username exists for any user other than current user
  RETURN QUERY 
  SELECT NOT EXISTS (
    SELECT 1
    FROM profiles
    WHERE username = input_username
    AND id != current_user_id
  ) AS available;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_profile(user_id uuid)
RETURNS TABLE(id uuid, full_name text, email text, phone text, role text, profile_pic text, date_of_birth date, gender text, bar_registration text, experience_years integer, specializations text, bio text, languages text, availability jsonb, address text, location text, website text, linkedin text, other_links text, notification_email boolean, notification_sms boolean, accepting_clients boolean, jurisdiction text, court_affiliations text, pin_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.phone,
    p.role,
    p.profile_pic,
    p.date_of_birth,
    p.gender,
    p.bar_registration,
    p.experience_years,
    p.specializations,
    p.bio,
    p.languages,
    p.availability,
    p.address,
    p.location,
    p.website,
    p.linkedin,
    p.other_links,
    p.notification_email,
    p.notification_sms,
    p.accepting_clients,
    p.jurisdiction,
    p.court_affiliations,
    p.pin_code
  FROM profiles p 
  WHERE p.id = user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_profile(user_id uuid, full_name text DEFAULT NULL::text, phone text DEFAULT NULL::text, date_of_birth date DEFAULT NULL::date, gender text DEFAULT NULL::text, role text DEFAULT NULL::text, bar_registration text DEFAULT NULL::text, experience_years integer DEFAULT NULL::integer, specializations text DEFAULT NULL::text, bio text DEFAULT NULL::text, address text DEFAULT NULL::text, location text DEFAULT NULL::text, pin_code text DEFAULT NULL::text, jurisdiction text DEFAULT NULL::text, court_affiliations text DEFAULT NULL::text, availability jsonb DEFAULT NULL::jsonb, notification_email boolean DEFAULT NULL::boolean, notification_sms boolean DEFAULT NULL::boolean, accepting_clients boolean DEFAULT NULL::boolean, website text DEFAULT NULL::text, linkedin text DEFAULT NULL::text, other_links text DEFAULT NULL::text, languages text DEFAULT NULL::text, profile_pic text DEFAULT NULL::text, username text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.profiles
  SET 
    full_name = COALESCE(update_user_profile.full_name, profiles.full_name),
    phone = COALESCE(update_user_profile.phone, profiles.phone),
    date_of_birth = COALESCE(update_user_profile.date_of_birth, profiles.date_of_birth),
    gender = COALESCE(update_user_profile.gender, profiles.gender),
    role = COALESCE(update_user_profile.role, profiles.role),
    bar_registration = COALESCE(update_user_profile.bar_registration, profiles.bar_registration),
    experience_years = COALESCE(update_user_profile.experience_years, profiles.experience_years),
    specializations = COALESCE(update_user_profile.specializations, profiles.specializations),
    bio = COALESCE(update_user_profile.bio, profiles.bio),
    address = COALESCE(update_user_profile.address, profiles.address),
    location = COALESCE(update_user_profile.location, profiles.location),
    pin_code = COALESCE(update_user_profile.pin_code, profiles.pin_code),
    jurisdiction = COALESCE(update_user_profile.jurisdiction, profiles.jurisdiction),
    court_affiliations = COALESCE(update_user_profile.court_affiliations, profiles.court_affiliations),
    availability = COALESCE(update_user_profile.availability, profiles.availability),
    notification_email = COALESCE(update_user_profile.notification_email, profiles.notification_email),
    notification_sms = COALESCE(update_user_profile.notification_sms, profiles.notification_sms),
    accepting_clients = COALESCE(update_user_profile.accepting_clients, profiles.accepting_clients),
    website = COALESCE(update_user_profile.website, profiles.website),
    linkedin = COALESCE(update_user_profile.linkedin, profiles.linkedin),
    other_links = COALESCE(update_user_profile.other_links, profiles.other_links),
    languages = COALESCE(update_user_profile.languages, profiles.languages),
    profile_pic = COALESCE(update_user_profile.profile_pic, profiles.profile_pic),
    username = update_user_profile.username,
    updated_at = now()
  WHERE id = user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_has_case_access(user_id uuid, case_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  is_admin boolean;
  is_case_creator boolean;
  is_assigned boolean;
BEGIN
  -- Check if user is admin
  SELECT (role = 'admin' OR role = 'partner') INTO is_admin FROM profiles WHERE id = user_id;
  
  -- Check if user created the case
  SELECT (created_by = user_id) INTO is_case_creator FROM cases WHERE id = case_id;
  
  -- Check if user is assigned to the case
  SELECT (assigned_to = user_id) INTO is_assigned FROM cases WHERE id = case_id;
  
  -- Return true if any of the conditions are met
  RETURN is_admin OR is_case_creator OR is_assigned;
END;
$function$;