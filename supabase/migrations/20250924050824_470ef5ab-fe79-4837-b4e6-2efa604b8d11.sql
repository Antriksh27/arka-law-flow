-- Enable Row Level Security on tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks table

-- Policy for selecting tasks: Users can view tasks in their firm
CREATE POLICY "tasks_select_firm_members" ON public.tasks
FOR SELECT 
USING (
  -- User is in the same firm as the task creator
  EXISTS (
    SELECT 1 FROM public.team_members tm1, public.team_members tm2
    WHERE tm1.user_id = auth.uid()
    AND tm2.user_id = tasks.created_by
    AND tm1.firm_id = tm2.firm_id
  )
  OR
  -- User is assigned to the task
  assigned_to = auth.uid()
  OR
  -- User created the task
  created_by = auth.uid()
);

-- Policy for inserting tasks: Authorized users can create tasks
CREATE POLICY "tasks_insert_authorized" ON public.tasks
FOR INSERT 
WITH CHECK (
  created_by = auth.uid()
  AND
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.role IN ('admin', 'lawyer', 'office_staff', 'paralegal')
  )
);

-- Policy for updating tasks: Users can update tasks they created or are assigned to, or if they're admin/lawyer
CREATE POLICY "tasks_update_authorized" ON public.tasks
FOR UPDATE 
USING (
  created_by = auth.uid()
  OR
  assigned_to = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.role IN ('admin', 'lawyer')
    AND tm.firm_id = (
      SELECT tm2.firm_id FROM public.team_members tm2 
      WHERE tm2.user_id = tasks.created_by
    )
  )
);

-- Policy for deleting tasks: Users can delete tasks they created or if they're admin
CREATE POLICY "tasks_delete_authorized" ON public.tasks
FOR DELETE 
USING (
  created_by = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.role = 'admin'
    AND tm.firm_id = (
      SELECT tm2.firm_id FROM public.team_members tm2 
      WHERE tm2.user_id = tasks.created_by
    )
  )
);