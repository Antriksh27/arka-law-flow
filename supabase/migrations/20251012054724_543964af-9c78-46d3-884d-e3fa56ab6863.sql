-- Create secure RPC to fetch firm members for chat
CREATE OR REPLACE FUNCTION public.get_firm_members_for_chat()
RETURNS TABLE (
  user_id uuid,
  role text,
  full_name text,
  email text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tm.user_id,
    tm.role::text,
    COALESCE(p.full_name, 'Unknown User') AS full_name,
    p.email
  FROM public.team_members tm
  LEFT JOIN public.profiles p ON p.id = tm.user_id
  WHERE tm.user_id <> auth.uid()
    AND tm.firm_id IN (
      SELECT tm2.firm_id FROM public.team_members tm2 WHERE tm2.user_id = auth.uid()
    )
    AND tm.role::text IN ('admin','lawyer','partner','associate','junior','paralegal','office_staff','receptionist')
    AND (tm.status IS NULL OR tm.status = 'active')
  ORDER BY COALESCE(p.full_name, 'Unknown User') ASC;
END;
$$;

-- Ensure authenticated users can execute
GRANT EXECUTE ON FUNCTION public.get_firm_members_for_chat() TO authenticated;