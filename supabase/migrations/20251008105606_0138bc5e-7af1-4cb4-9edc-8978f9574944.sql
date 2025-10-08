-- Create petitioners table
CREATE TABLE IF NOT EXISTS public.petitioners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  legalkart_case_id UUID REFERENCES public.legalkart_cases(id) ON DELETE CASCADE,
  petitioner_name TEXT NOT NULL,
  advocate_name TEXT,
  advocate_enrollment_no TEXT,
  party_type TEXT DEFAULT 'petitioner',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create respondents table
CREATE TABLE IF NOT EXISTS public.respondents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  legalkart_case_id UUID REFERENCES public.legalkart_cases(id) ON DELETE CASCADE,
  respondent_name TEXT NOT NULL,
  advocate_name TEXT,
  advocate_enrollment_no TEXT,
  party_type TEXT DEFAULT 'respondent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ia_details table
CREATE TABLE IF NOT EXISTS public.ia_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  legalkart_case_id UUID REFERENCES public.legalkart_cases(id) ON DELETE CASCADE,
  ia_number TEXT,
  party TEXT,
  date_of_filing DATE,
  next_date DATE,
  ia_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.petitioners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respondents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_details ENABLE ROW LEVEL SECURITY;

-- RLS Policies for petitioners
CREATE POLICY "Firm members can view petitioners" ON public.petitioners 
FOR SELECT 
USING (
  case_id IN (
    SELECT id FROM public.cases 
    WHERE firm_id IN (
      SELECT firm_id FROM public.team_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Authorized users can insert petitioners" ON public.petitioners 
FOR INSERT 
WITH CHECK (
  case_id IN (
    SELECT id FROM public.cases 
    WHERE firm_id IN (
      SELECT firm_id FROM public.team_members 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'lawyer', 'office_staff')
    )
  )
);

-- RLS Policies for respondents
CREATE POLICY "Firm members can view respondents" ON public.respondents 
FOR SELECT 
USING (
  case_id IN (
    SELECT id FROM public.cases 
    WHERE firm_id IN (
      SELECT firm_id FROM public.team_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Authorized users can insert respondents" ON public.respondents 
FOR INSERT 
WITH CHECK (
  case_id IN (
    SELECT id FROM public.cases 
    WHERE firm_id IN (
      SELECT firm_id FROM public.team_members 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'lawyer', 'office_staff')
    )
  )
);

-- RLS Policies for ia_details
CREATE POLICY "Firm members can view ia_details" ON public.ia_details 
FOR SELECT 
USING (
  case_id IN (
    SELECT id FROM public.cases 
    WHERE firm_id IN (
      SELECT firm_id FROM public.team_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Authorized users can insert ia_details" ON public.ia_details 
FOR INSERT 
WITH CHECK (
  case_id IN (
    SELECT id FROM public.cases 
    WHERE firm_id IN (
      SELECT firm_id FROM public.team_members 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'lawyer', 'office_staff')
    )
  )
);