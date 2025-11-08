-- Enable RLS on tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

-- Policy: Users can view tasks they created or are assigned to
CREATE POLICY "Users can view their own tasks"
ON public.tasks
FOR SELECT
USING (
  auth.uid() = created_by OR auth.uid() = assigned_to
);

-- Policy: Users can insert tasks (as creator)
CREATE POLICY "Users can insert their own tasks"
ON public.tasks
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
);

-- Policy: Users can update tasks they created or are assigned to
CREATE POLICY "Users can update their own tasks"
ON public.tasks
FOR UPDATE
USING (
  auth.uid() = created_by OR auth.uid() = assigned_to
);

-- Policy: Users can delete tasks they created
CREATE POLICY "Users can delete their own tasks"
ON public.tasks
FOR DELETE
USING (
  auth.uid() = created_by
);