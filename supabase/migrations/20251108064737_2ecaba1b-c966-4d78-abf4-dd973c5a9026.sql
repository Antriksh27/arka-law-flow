-- Drop all existing policies on tasks table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tasks' AND schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.tasks';
    END LOOP;
END $$;

-- Create restrictive policies: users can ONLY see tasks created by them OR assigned to them
CREATE POLICY "Users can view tasks created by or assigned to them"
ON public.tasks
FOR SELECT
USING (
  auth.uid() = created_by OR auth.uid() = assigned_to
);

CREATE POLICY "Users can create tasks"
ON public.tasks
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
);

CREATE POLICY "Users can update tasks created by or assigned to them"
ON public.tasks
FOR UPDATE
USING (
  auth.uid() = created_by OR auth.uid() = assigned_to
);

CREATE POLICY "Users can delete tasks they created"
ON public.tasks
FOR DELETE
USING (
  auth.uid() = created_by
);