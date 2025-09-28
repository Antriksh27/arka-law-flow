-- Create Legalkart Cases table
CREATE TABLE public.legalkart_cases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cnr_number text NOT NULL UNIQUE,
  filing_date date,
  filing_number text,
  registration_date date,
  registration_number text,
  coram text,
  state text,
  district text,
  bench_type text,
  stage_of_case text,
  judicial_branch text,
  next_hearing_date date,
  before_me_part_heard text,
  category text,
  sub_category text,
  petitioner_and_advocate text,
  respondent_and_advocate text,
  firm_id uuid,
  case_id uuid, -- Link to existing cases table if needed
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  raw_api_response jsonb -- Store full API response for reference
);

-- Create index on CNR number for fast lookups
CREATE INDEX idx_legalkart_cases_cnr_number ON public.legalkart_cases(cnr_number);
CREATE INDEX idx_legalkart_cases_firm_id ON public.legalkart_cases(firm_id);

-- Create Legalkart Case Documents table
CREATE TABLE public.legalkart_case_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  legalkart_case_id uuid NOT NULL REFERENCES public.legalkart_cases(id) ON DELETE CASCADE,
  sr_no text,
  advocate text,
  filed_by text,
  document_no text,
  document_filed text,
  date_of_receiving date,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_legalkart_case_documents_case_id ON public.legalkart_case_documents(legalkart_case_id);

-- Create Legalkart Case Objections table
CREATE TABLE public.legalkart_case_objections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  legalkart_case_id uuid NOT NULL REFERENCES public.legalkart_cases(id) ON DELETE CASCADE,
  sr_no text,
  objection text,
  receipt_date date,
  scrutiny_date date,
  objection_compliance_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_legalkart_case_objections_case_id ON public.legalkart_case_objections(legalkart_case_id);

-- Create Legalkart Case Orders table
CREATE TABLE public.legalkart_case_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  legalkart_case_id uuid NOT NULL REFERENCES public.legalkart_cases(id) ON DELETE CASCADE,
  judge text,
  hearing_date date,
  order_number text,
  bench text,
  order_details text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_legalkart_case_orders_case_id ON public.legalkart_case_orders(legalkart_case_id);

-- Create Legalkart Case History table
CREATE TABLE public.legalkart_case_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  legalkart_case_id uuid NOT NULL REFERENCES public.legalkart_cases(id) ON DELETE CASCADE,
  judge text,
  hearing_date date,
  cause_list_type text,
  business_on_date date,
  purpose_of_hearing text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_legalkart_case_history_case_id ON public.legalkart_case_history(legalkart_case_id);

-- Add updated_at trigger for legalkart_cases
CREATE TRIGGER update_legalkart_cases_updated_at
  BEFORE UPDATE ON public.legalkart_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.legalkart_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legalkart_case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legalkart_case_objections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legalkart_case_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legalkart_case_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for legalkart_cases
CREATE POLICY "Firm members can view legalkart cases"
  ON public.legalkart_cases
  FOR SELECT
  USING (firm_id IN (
    SELECT tm.firm_id FROM public.team_members tm WHERE tm.user_id = auth.uid()
  ));

CREATE POLICY "Authorized users can insert legalkart cases"
  ON public.legalkart_cases
  FOR INSERT
  WITH CHECK (firm_id IN (
    SELECT tm.firm_id FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'lawyer', 'office_staff')
  ));

CREATE POLICY "Authorized users can update legalkart cases"
  ON public.legalkart_cases
  FOR UPDATE
  USING (firm_id IN (
    SELECT tm.firm_id FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'lawyer', 'office_staff')
  ));

CREATE POLICY "Admins can delete legalkart cases"
  ON public.legalkart_cases
  FOR DELETE
  USING (firm_id IN (
    SELECT tm.firm_id FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role = 'admin'
  ));

-- RLS Policies for related tables (documents, objections, orders, history)
-- Documents policies
CREATE POLICY "Users can view legalkart case documents"
  ON public.legalkart_case_documents
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.legalkart_cases lc 
    WHERE lc.id = legalkart_case_documents.legalkart_case_id 
    AND lc.firm_id IN (
      SELECT tm.firm_id FROM public.team_members tm WHERE tm.user_id = auth.uid()
    )
  ));

CREATE POLICY "Authorized users can manage legalkart case documents"
  ON public.legalkart_case_documents
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.legalkart_cases lc 
    WHERE lc.id = legalkart_case_documents.legalkart_case_id 
    AND lc.firm_id IN (
      SELECT tm.firm_id FROM public.team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.role IN ('admin', 'lawyer', 'office_staff')
    )
  ));

-- Objections policies
CREATE POLICY "Users can view legalkart case objections"
  ON public.legalkart_case_objections
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.legalkart_cases lc 
    WHERE lc.id = legalkart_case_objections.legalkart_case_id 
    AND lc.firm_id IN (
      SELECT tm.firm_id FROM public.team_members tm WHERE tm.user_id = auth.uid()
    )
  ));

CREATE POLICY "Authorized users can manage legalkart case objections"
  ON public.legalkart_case_objections
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.legalkart_cases lc 
    WHERE lc.id = legalkart_case_objections.legalkart_case_id 
    AND lc.firm_id IN (
      SELECT tm.firm_id FROM public.team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.role IN ('admin', 'lawyer', 'office_staff')
    )
  ));

-- Orders policies
CREATE POLICY "Users can view legalkart case orders"
  ON public.legalkart_case_orders
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.legalkart_cases lc 
    WHERE lc.id = legalkart_case_orders.legalkart_case_id 
    AND lc.firm_id IN (
      SELECT tm.firm_id FROM public.team_members tm WHERE tm.user_id = auth.uid()
    )
  ));

CREATE POLICY "Authorized users can manage legalkart case orders"
  ON public.legalkart_case_orders
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.legalkart_cases lc 
    WHERE lc.id = legalkart_case_orders.legalkart_case_id 
    AND lc.firm_id IN (
      SELECT tm.firm_id FROM public.team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.role IN ('admin', 'lawyer', 'office_staff')
    )
  ));

-- History policies
CREATE POLICY "Users can view legalkart case history"
  ON public.legalkart_case_history
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.legalkart_cases lc 
    WHERE lc.id = legalkart_case_history.legalkart_case_id 
    AND lc.firm_id IN (
      SELECT tm.firm_id FROM public.team_members tm WHERE tm.user_id = auth.uid()
    )
  ));

CREATE POLICY "Authorized users can manage legalkart case history"
  ON public.legalkart_case_history
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.legalkart_cases lc 
    WHERE lc.id = legalkart_case_history.legalkart_case_id 
    AND lc.firm_id IN (
      SELECT tm.firm_id FROM public.team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.role IN ('admin', 'lawyer', 'office_staff')
    )
  ));

-- Function to upsert Legalkart case data with automatic cleanup
CREATE OR REPLACE FUNCTION public.upsert_legalkart_case_data(
  p_cnr_number text,
  p_firm_id uuid,
  p_case_id uuid DEFAULT NULL,
  p_case_data jsonb DEFAULT NULL,
  p_documents jsonb DEFAULT NULL,
  p_objections jsonb DEFAULT NULL,
  p_orders jsonb DEFAULT NULL,
  p_history jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_legalkart_case_id uuid;
  doc_item jsonb;
  obj_item jsonb;
  order_item jsonb;
  hist_item jsonb;
BEGIN
  -- Upsert the main case record
  INSERT INTO public.legalkart_cases (
    cnr_number, firm_id, case_id, 
    filing_date, filing_number, registration_date, registration_number,
    coram, state, district, bench_type, stage_of_case, judicial_branch,
    next_hearing_date, before_me_part_heard, category, sub_category,
    petitioner_and_advocate, respondent_and_advocate, raw_api_response
  ) VALUES (
    p_cnr_number, p_firm_id, p_case_id,
    (p_case_data->>'filing_date')::date,
    p_case_data->>'filing_number',
    (p_case_data->>'registration_date')::date,
    p_case_data->>'registration_number',
    p_case_data->>'coram',
    p_case_data->>'state',
    p_case_data->>'district',
    p_case_data->>'bench_type',
    p_case_data->>'stage_of_case',
    p_case_data->>'judicial_branch',
    (p_case_data->>'next_hearing_date')::date,
    p_case_data->>'before_me_part_heard',
    p_case_data->>'category',
    p_case_data->>'sub_category',
    p_case_data->>'petitioner_and_advocate',
    p_case_data->>'respondent_and_advocate',
    p_case_data
  )
  ON CONFLICT (cnr_number) 
  DO UPDATE SET
    firm_id = EXCLUDED.firm_id,
    case_id = EXCLUDED.case_id,
    filing_date = EXCLUDED.filing_date,
    filing_number = EXCLUDED.filing_number,
    registration_date = EXCLUDED.registration_date,
    registration_number = EXCLUDED.registration_number,
    coram = EXCLUDED.coram,
    state = EXCLUDED.state,
    district = EXCLUDED.district,
    bench_type = EXCLUDED.bench_type,
    stage_of_case = EXCLUDED.stage_of_case,
    judicial_branch = EXCLUDED.judicial_branch,
    next_hearing_date = EXCLUDED.next_hearing_date,
    before_me_part_heard = EXCLUDED.before_me_part_heard,
    category = EXCLUDED.category,
    sub_category = EXCLUDED.sub_category,
    petitioner_and_advocate = EXCLUDED.petitioner_and_advocate,
    respondent_and_advocate = EXCLUDED.respondent_and_advocate,
    raw_api_response = EXCLUDED.raw_api_response,
    updated_at = now()
  RETURNING id INTO v_legalkart_case_id;

  -- Clear old related records
  DELETE FROM public.legalkart_case_documents WHERE legalkart_case_id = v_legalkart_case_id;
  DELETE FROM public.legalkart_case_objections WHERE legalkart_case_id = v_legalkart_case_id;
  DELETE FROM public.legalkart_case_orders WHERE legalkart_case_id = v_legalkart_case_id;
  DELETE FROM public.legalkart_case_history WHERE legalkart_case_id = v_legalkart_case_id;

  -- Insert documents if provided
  IF p_documents IS NOT NULL THEN
    FOR doc_item IN SELECT * FROM jsonb_array_elements(p_documents)
    LOOP
      INSERT INTO public.legalkart_case_documents (
        legalkart_case_id, sr_no, advocate, filed_by, document_no, document_filed, date_of_receiving
      ) VALUES (
        v_legalkart_case_id,
        doc_item->>'sr_no',
        doc_item->>'advocate',
        doc_item->>'filed_by',
        doc_item->>'document_no',
        doc_item->>'document_filed',
        (doc_item->>'date_of_receiving')::date
      );
    END LOOP;
  END IF;

  -- Insert objections if provided
  IF p_objections IS NOT NULL THEN
    FOR obj_item IN SELECT * FROM jsonb_array_elements(p_objections)
    LOOP
      INSERT INTO public.legalkart_case_objections (
        legalkart_case_id, sr_no, objection, receipt_date, scrutiny_date, objection_compliance_date
      ) VALUES (
        v_legalkart_case_id,
        obj_item->>'sr_no',
        obj_item->>'objection',
        (obj_item->>'receipt_date')::date,
        (obj_item->>'scrutiny_date')::date,
        (obj_item->>'objection_compliance_date')::date
      );
    END LOOP;
  END IF;

  -- Insert orders if provided
  IF p_orders IS NOT NULL THEN
    FOR order_item IN SELECT * FROM jsonb_array_elements(p_orders)
    LOOP
      INSERT INTO public.legalkart_case_orders (
        legalkart_case_id, judge, hearing_date, order_number, bench, order_details
      ) VALUES (
        v_legalkart_case_id,
        order_item->>'judge',
        (order_item->>'hearing_date')::date,
        order_item->>'order_number',
        order_item->>'bench',
        order_item->>'order_details'
      );
    END LOOP;
  END IF;

  -- Insert history if provided
  IF p_history IS NOT NULL THEN
    FOR hist_item IN SELECT * FROM jsonb_array_elements(p_history)
    LOOP
      INSERT INTO public.legalkart_case_history (
        legalkart_case_id, judge, hearing_date, cause_list_type, business_on_date, purpose_of_hearing
      ) VALUES (
        v_legalkart_case_id,
        hist_item->>'judge',
        (hist_item->>'hearing_date')::date,
        hist_item->>'cause_list_type',
        (hist_item->>'business_on_date')::date,
        hist_item->>'purpose_of_hearing'
      );
    END LOOP;
  END IF;

  RETURN v_legalkart_case_id;
END;
$$;