-- Fix remaining critical security issues from linter

-- Fix remaining functions with mutable search paths
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

CREATE OR REPLACE FUNCTION public.is_current_user_admin_in_firm()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
    AND firm_id = public.get_current_user_firm_id()
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_profile()
 RETURNS TABLE(id uuid, full_name text, email text, role text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.role
  FROM public.profiles p
  WHERE p.id = auth.uid();
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