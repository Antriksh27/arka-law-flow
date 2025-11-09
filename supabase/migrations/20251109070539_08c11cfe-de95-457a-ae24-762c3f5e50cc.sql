-- Create case_internal_notes table
CREATE TABLE public.case_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.case_internal_notes ENABLE ROW LEVEL SECURITY;

-- Create index for performance
CREATE INDEX idx_case_internal_notes_case_id ON public.case_internal_notes(case_id);
CREATE INDEX idx_case_internal_notes_created_by ON public.case_internal_notes(created_by);

-- RLS Policies: Only office_staff, admin, and note creators can access
CREATE POLICY "Authorized users can view internal notes"
ON public.case_internal_notes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.role IN ('admin', 'office_staff', 'lawyer')
  )
);

CREATE POLICY "Authorized users can create internal notes"
ON public.case_internal_notes
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.role IN ('admin', 'office_staff', 'lawyer')
  )
);

CREATE POLICY "Authorized users can update their own internal notes"
ON public.case_internal_notes
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.role = 'admin'
  )
);

CREATE POLICY "Authorized users can delete internal notes"
ON public.case_internal_notes
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.role = 'admin'
  )
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_case_internal_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_case_internal_notes_updated_at_trigger
BEFORE UPDATE ON public.case_internal_notes
FOR EACH ROW
EXECUTE FUNCTION update_case_internal_notes_updated_at();