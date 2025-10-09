-- Add RLS policy to allow viewing tasks for cases user has access to
CREATE POLICY "tasks_select_by_case_access"
  ON public.tasks FOR SELECT
  USING (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN team_members tm ON tm.firm_id = c.firm_id
      WHERE tm.user_id = auth.uid()
      AND (
        -- Junior role: only see tasks for cases they're assigned to
        CASE 
          WHEN tm.role = 'junior' THEN 
            (c.created_by = auth.uid() OR c.assigned_to = auth.uid() OR auth.uid() = ANY(c.assigned_users))
          ELSE true
        END
      )
    )
  );