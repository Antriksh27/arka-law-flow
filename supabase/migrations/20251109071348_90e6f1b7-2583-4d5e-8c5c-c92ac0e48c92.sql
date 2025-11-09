-- Drop the existing view policy for internal notes
DROP POLICY IF EXISTS "Authorized users can view internal notes" ON public.case_internal_notes;

-- Create new policy: Lawyers see only their own notes, office_staff and admin see all
CREATE POLICY "View internal notes based on role"
ON public.case_internal_notes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND (
      -- Admin and office_staff can see all notes
      tm.role IN ('admin', 'office_staff')
      -- Lawyers can only see their own notes
      OR (tm.role = 'lawyer' AND case_internal_notes.created_by = auth.uid())
    )
  )
);