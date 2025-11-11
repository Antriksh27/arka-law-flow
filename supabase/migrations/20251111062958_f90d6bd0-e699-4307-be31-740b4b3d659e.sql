-- Create hearings table for scheduled court hearings
CREATE TABLE IF NOT EXISTS public.hearings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL,
  hearing_date DATE NOT NULL,
  hearing_time TIME,
  hearing_type TEXT,
  court_name TEXT,
  bench TEXT,
  coram TEXT,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  outcome TEXT,
  next_hearing_date DATE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on hearings table
ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;

-- Create policies for hearings table
CREATE POLICY "Firm members can view hearings"
  ON public.hearings
  FOR SELECT
  USING (
    firm_id IN (
      SELECT tm.firm_id FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Authorized users can insert hearings"
  ON public.hearings
  FOR INSERT
  WITH CHECK (
    firm_id IN (
      SELECT tm.firm_id FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.role IN ('admin', 'lawyer', 'office_staff', 'paralegal')
    )
  );

CREATE POLICY "Authorized users can update hearings"
  ON public.hearings
  FOR UPDATE
  USING (
    firm_id IN (
      SELECT tm.firm_id FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.role IN ('admin', 'lawyer', 'office_staff', 'paralegal')
    )
  );

CREATE POLICY "Authorized users can delete hearings"
  ON public.hearings
  FOR DELETE
  USING (
    firm_id IN (
      SELECT tm.firm_id FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.role IN ('admin', 'lawyer')
    )
  );

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_hearings_case_id ON public.hearings(case_id);
CREATE INDEX IF NOT EXISTS idx_hearings_firm_id ON public.hearings(firm_id);
CREATE INDEX IF NOT EXISTS idx_hearings_hearing_date ON public.hearings(hearing_date);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_hearings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_hearings_updated_at_trigger
  BEFORE UPDATE ON public.hearings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_hearings_updated_at();
