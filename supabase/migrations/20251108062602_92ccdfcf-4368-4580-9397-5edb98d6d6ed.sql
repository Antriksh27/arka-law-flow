-- Drop ALL existing policies on tasks table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tasks' AND schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.tasks';
    END LOOP;
END $$;

-- Create new firm-based policies that allow users to see all tasks in their firm
CREATE POLICY "Users can view tasks in their firm"
ON public.tasks
FOR SELECT
USING (
  firm_id IN (
    SELECT firm_id 
    FROM team_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create tasks in their firm"
ON public.tasks
FOR INSERT
WITH CHECK (
  firm_id IN (
    SELECT firm_id 
    FROM team_members 
    WHERE user_id = auth.uid()
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Users can update tasks in their firm"
ON public.tasks
FOR UPDATE
USING (
  firm_id IN (
    SELECT firm_id 
    FROM team_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete tasks they created"
ON public.tasks
FOR DELETE
USING (
  created_by = auth.uid()
);