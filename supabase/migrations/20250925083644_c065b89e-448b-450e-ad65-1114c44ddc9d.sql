-- Create a reliable RPC to fetch team members (lawyers/admins/juniors) with names
-- Falls back to auth.users metadata/email if profiles row is missing
CREATE OR REPLACE FUNCTION public.get_team_members_with_names(p_roles text[])
RETURNS TABLE(user_id uuid, role text, full_name text, email text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tm.user_id,
    tm.role::text AS role,
    COALESCE(p.full_name, (au.raw_user_meta_data->>'full_name'), au.email, 'Unknown User') AS full_name,
    COALESCE(p.email, au.email) AS email
  FROM public.team_members tm
  LEFT JOIN public.profiles p ON p.id = tm.user_id
  LEFT JOIN auth.users au ON au.id = tm.user_id
  WHERE tm.role::text = ANY (p_roles)
    AND tm.firm_id IN (
      SELECT firm_id FROM public.team_members WHERE user_id = auth.uid()
    );
END;
$$;