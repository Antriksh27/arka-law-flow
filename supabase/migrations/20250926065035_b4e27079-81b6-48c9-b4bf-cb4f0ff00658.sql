-- Fix ambiguous column reference in RPC: get_lawyers_and_juniors
CREATE OR REPLACE FUNCTION public.get_lawyers_and_juniors()
RETURNS TABLE(user_id uuid, role text, full_name text, email text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    tm.user_id,
    tm.role::text,
    COALESCE(p.full_name, 'Unknown User') AS full_name,
    p.email
  FROM public.team_members tm
  LEFT JOIN public.profiles p ON p.id = tm.user_id
  WHERE tm.role::text IN ('lawyer', 'admin', 'junior')
    AND tm.firm_id IN (
      SELECT tm2.firm_id
      FROM public.team_members tm2
      WHERE tm2.user_id = auth.uid()
    )
  ORDER BY 
    CASE WHEN p.full_name ILIKE '%Chitrajeet%' THEN 0 ELSE 1 END,
    p.full_name ASC;
END;
$function$;