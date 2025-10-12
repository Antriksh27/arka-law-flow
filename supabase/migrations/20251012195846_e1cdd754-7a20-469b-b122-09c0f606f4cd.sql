-- Fix case_activities INSERT policy to avoid invalid "unnest" reference
-- Recreate with correct ANY(array) syntax
DROP POLICY IF EXISTS "Users can insert case activities" ON public.case_activities;

CREATE POLICY "Users can insert case activities"
ON public.case_activities
FOR INSERT
TO authenticated
WITH CHECK (
  (
    case_id IS NOT NULL AND
    EXISTS (
      SELECT 1
      FROM public.cases
      WHERE cases.id = case_activities.case_id
        AND (
          cases.created_by = auth.uid()
          OR cases.assigned_to = auth.uid()
          OR auth.uid() = ANY (cases.assigned_users)
        )
    )
  )
  OR (case_id IS NULL AND auth.uid() IS NOT NULL)
  OR (created_by = auth.uid())
);

-- Ensure SELECT policy remains as intended (no change, included for clarity)
-- Note: We don't drop/recreate SELECT to minimize impact