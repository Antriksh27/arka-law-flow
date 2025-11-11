-- Drop the hearings table we just created
DROP TABLE IF EXISTS public.hearings CASCADE;

-- Add missing columns to case_hearings table to match what the code expects
ALTER TABLE public.case_hearings
ADD COLUMN IF NOT EXISTS hearing_type TEXT,
ADD COLUMN IF NOT EXISTS court_name TEXT,
ADD COLUMN IF NOT EXISTS bench TEXT,
ADD COLUMN IF NOT EXISTS coram TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled',
ADD COLUMN IF NOT EXISTS outcome TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS next_hearing_date DATE,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS firm_id UUID,
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_case_hearings_firm_id ON public.case_hearings(firm_id);
CREATE INDEX IF NOT EXISTS idx_case_hearings_assigned_to ON public.case_hearings(assigned_to);
CREATE INDEX IF NOT EXISTS idx_case_hearings_hearing_date ON public.case_hearings(hearing_date);

-- Update existing RLS policies to include firm_id check
DROP POLICY IF EXISTS "Authorized users can insert case hearings" ON public.case_hearings;
DROP POLICY IF EXISTS "Firm members can view case hearings" ON public.case_hearings;

CREATE POLICY "Firm members can view case hearings"
  ON public.case_hearings
  FOR SELECT
  USING (
    firm_id IN (
      SELECT tm.firm_id FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Authorized users can insert case hearings"
  ON public.case_hearings
  FOR INSERT
  WITH CHECK (
    firm_id IN (
      SELECT tm.firm_id FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.role IN ('admin', 'lawyer', 'office_staff', 'paralegal')
    )
  );

CREATE POLICY "Authorized users can update case hearings"
  ON public.case_hearings
  FOR UPDATE
  USING (
    firm_id IN (
      SELECT tm.firm_id FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.role IN ('admin', 'lawyer', 'office_staff', 'paralegal')
    )
  );

CREATE POLICY "Authorized users can delete case hearings"
  ON public.case_hearings
  FOR DELETE
  USING (
    firm_id IN (
      SELECT tm.firm_id FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.role IN ('admin', 'lawyer')
    )
  );
