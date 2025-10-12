-- Rebuild RLS policies on public.cases to eliminate any invalid UNNEST usage
-- and ensure inserts/selects/updates work with assigned_users via ANY()

-- Enable RLS (idempotent)
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can delete cases they created" ON public.cases;
DROP POLICY IF EXISTS "Users can insert cases" ON public.cases;
DROP POLICY IF EXISTS "Users can update cases they created or are assigned to" ON public.cases;
DROP POLICY IF EXISTS "Users can view cases they created or are assigned to" ON public.cases;
DROP POLICY IF EXISTS "cases_delete_admin" ON public.cases;
DROP POLICY IF EXISTS "cases_insert_authorized" ON public.cases;
DROP POLICY IF EXISTS "cases_select_firm_members" ON public.cases;
DROP POLICY IF EXISTS "cases_update_authorized" ON public.cases;

-- SELECT: Firm members can view cases, with junior restriction
CREATE POLICY "cases_select_firm_members"
ON public.cases
FOR SELECT
TO authenticated
USING (
  (
    firm_id IN (
      SELECT tm.firm_id FROM public.team_members tm WHERE tm.user_id = auth.uid()
    )
    AND (
      CASE 
        WHEN (
          SELECT tm.role FROM public.team_members tm 
          WHERE tm.user_id = auth.uid() 
          LIMIT 1
        ) = 'junior'::team_role_enum
        THEN (auth.uid() = created_by OR auth.uid() = assigned_to OR auth.uid() = ANY (assigned_users))
        ELSE true
      END
    )
  )
);

-- SELECT: Additionally allow direct access when creator/assignee/assigned_users
CREATE POLICY "Users can view cases they created or are assigned to"
ON public.cases
FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by OR auth.uid() = assigned_to OR auth.uid() = ANY (assigned_users)
);

-- INSERT: Must be creator
CREATE POLICY "Users can insert cases"
ON public.cases
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- INSERT: Authorized firm roles
CREATE POLICY "cases_insert_authorized"
ON public.cases
FOR INSERT
TO authenticated
WITH CHECK (
  firm_id IN (
    SELECT tm.firm_id FROM public.team_members tm WHERE tm.user_id = auth.uid()
  )
  AND (
    SELECT tm.role FROM public.team_members tm WHERE tm.user_id = auth.uid() LIMIT 1
  ) = ANY (ARRAY['admin'::team_role_enum, 'lawyer'::team_role_enum, 'office_staff'::team_role_enum])
);

-- UPDATE: Creator/assignee/assigned_users can update
CREATE POLICY "Users can update cases they created or are assigned to"
ON public.cases
FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by OR auth.uid() = assigned_to OR auth.uid() = ANY (assigned_users)
);

-- UPDATE: Authorized firm roles can update
CREATE POLICY "cases_update_authorized"
ON public.cases
FOR UPDATE
TO authenticated
USING (
  firm_id IN (
    SELECT tm.firm_id FROM public.team_members tm WHERE tm.user_id = auth.uid()
  )
  AND (
    SELECT tm.role FROM public.team_members tm WHERE tm.user_id = auth.uid() LIMIT 1
  ) = ANY (ARRAY['admin'::team_role_enum, 'lawyer'::team_role_enum, 'office_staff'::team_role_enum])
);

-- DELETE: Creator can delete
CREATE POLICY "Users can delete cases they created"
ON public.cases
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- DELETE: Firm admin can delete
CREATE POLICY "cases_delete_admin"
ON public.cases
FOR DELETE
TO authenticated
USING (
  firm_id IN (
    SELECT tm.firm_id FROM public.team_members tm WHERE tm.user_id = auth.uid() AND tm.role = 'admin'::team_role_enum
  )
);
