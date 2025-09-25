-- Drop the problematic function and create a simpler one
DROP FUNCTION IF EXISTS public.get_team_members_with_names(text[]);

-- Create a simpler function that only uses public tables
CREATE OR REPLACE FUNCTION public.get_lawyers_and_juniors()
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
    tm.role::text,
    COALESCE(p.full_name, 'Unknown User') as full_name,
    p.email
  FROM public.team_members tm
  LEFT JOIN public.profiles p ON p.id = tm.user_id
  WHERE tm.role::text IN ('lawyer', 'admin', 'junior')
    AND tm.firm_id IN (
      SELECT firm_id FROM public.team_members WHERE user_id = auth.uid()
    )
  ORDER BY 
    CASE WHEN p.full_name ILIKE '%Chitrajeet%' THEN 0 ELSE 1 END,
    p.full_name ASC;
END;
$$;