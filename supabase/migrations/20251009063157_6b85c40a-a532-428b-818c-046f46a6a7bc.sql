-- Create case_contacts table for managing multiple contacts per case
CREATE TABLE IF NOT EXISTS public.case_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.case_contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies for case_contacts
CREATE POLICY "Firm members can view case contacts"
  ON public.case_contacts FOR SELECT
  USING (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN team_members tm ON tm.firm_id = c.firm_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Authorized users can insert case contacts"
  ON public.case_contacts FOR INSERT
  WITH CHECK (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN team_members tm ON tm.firm_id = c.firm_id
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('admin', 'lawyer', 'office_staff')
    )
  );

CREATE POLICY "Authorized users can delete case contacts"
  ON public.case_contacts FOR DELETE
  USING (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN team_members tm ON tm.firm_id = c.firm_id
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('admin', 'lawyer', 'office_staff')
    )
  );

-- Create case_relations table for linking related cases
CREATE TABLE IF NOT EXISTS public.case_relations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  related_case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(case_id, related_case_id)
);

-- Enable RLS
ALTER TABLE public.case_relations ENABLE ROW LEVEL SECURITY;

-- RLS policies for case_relations
CREATE POLICY "Firm members can view case relations"
  ON public.case_relations FOR SELECT
  USING (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN team_members tm ON tm.firm_id = c.firm_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Authorized users can insert case relations"
  ON public.case_relations FOR INSERT
  WITH CHECK (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN team_members tm ON tm.firm_id = c.firm_id
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('admin', 'lawyer', 'office_staff')
    )
  );

CREATE POLICY "Authorized users can delete case relations"
  ON public.case_relations FOR DELETE
  USING (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN team_members tm ON tm.firm_id = c.firm_id
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('admin', 'lawyer', 'office_staff')
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_case_contacts_case_id ON public.case_contacts(case_id);
CREATE INDEX idx_case_relations_case_id ON public.case_relations(case_id);
CREATE INDEX idx_case_relations_related_case_id ON public.case_relations(related_case_id);