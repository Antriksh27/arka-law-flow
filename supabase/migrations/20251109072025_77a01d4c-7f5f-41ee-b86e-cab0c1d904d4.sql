-- Add shared_with_staff column to case_internal_notes
ALTER TABLE public.case_internal_notes 
ADD COLUMN IF NOT EXISTS shared_with_staff BOOLEAN DEFAULT FALSE;

-- Update the view policy to allow office_staff and admins to see shared notes from lawyers
DROP POLICY IF EXISTS "View internal notes based on role" ON public.case_internal_notes;

CREATE POLICY "View internal notes based on role"
ON public.case_internal_notes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND (
      -- Admin and office_staff can see all their own notes and shared lawyer notes
      (tm.role IN ('admin', 'office_staff') AND (case_internal_notes.created_by = auth.uid() OR case_internal_notes.shared_with_staff = true))
      -- Lawyers can only see their own notes
      OR (tm.role = 'lawyer' AND case_internal_notes.created_by = auth.uid())
    )
  )
);

-- Allow lawyers to update their own notes (for sharing)
CREATE POLICY "Lawyers can update their own notes"
ON public.case_internal_notes
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.role = 'lawyer'
  )
)
WITH CHECK (
  created_by = auth.uid()
);