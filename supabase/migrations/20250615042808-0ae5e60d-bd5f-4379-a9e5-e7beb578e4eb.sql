
-- This function creates a new law firm and assigns the calling user as the firm's first admin.
-- It takes the desired firm name as input and returns the new firm's ID.
-- Using SECURITY DEFINER allows it to access user metadata required for setup.
CREATE OR REPLACE FUNCTION public.create_firm_and_assign_admin(firm_name text)
RETURNS uuid -- Returns the new firm's ID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_firm_id uuid;
  current_user_id uuid := auth.uid();
  user_meta jsonb;
  user_full_name text;
  user_email_address text;
BEGIN
  -- Get user details from auth.users table
  SELECT raw_user_meta_data, email INTO user_meta, user_email_address
  FROM auth.users
  WHERE id = current_user_id;

  user_full_name := user_meta->>'full_name';
  
  -- If full name is not available in metadata, use the email address as a fallback.
  IF user_full_name IS NULL OR user_full_name = '' THEN
    user_full_name := user_email_address;
  END IF;

  -- Step 1: Insert the new law firm into the `law_firms` table.
  -- The creator and admin are set to the current user.
  INSERT INTO public.law_firms (name, created_by, admin_id)
  VALUES (firm_name, current_user_id, current_user_id)
  RETURNING id INTO new_firm_id;

  -- Step 2: Add the current user to the `team_members` table as an 'admin' for the new firm.
  INSERT INTO public.team_members (user_id, firm_id, role, status, full_name, email)
  VALUES (current_user_id, new_firm_id, 'admin', 'active', user_full_name, user_email_address);

  -- Step 3: Return the ID of the newly created firm.
  RETURN new_firm_id;
END;
$$;
