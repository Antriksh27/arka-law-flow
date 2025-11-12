-- Fix the upsert_legalkart_case_data RPC function to use correct column name
-- The column in legalkart_cases table is 'cnr_number', not 'cnr_num'

CREATE OR REPLACE FUNCTION public.upsert_legalkart_case_data(
  p_cnr_number text,
  p_firm_id uuid,
  p_case_id uuid DEFAULT NULL,
  p_case_data jsonb DEFAULT '{}'::jsonb,
  p_documents jsonb DEFAULT '[]'::jsonb,
  p_objections jsonb DEFAULT '[]'::jsonb,
  p_orders jsonb DEFAULT '[]'::jsonb,
  p_history jsonb DEFAULT '[]'::jsonb,
  p_petitioners jsonb DEFAULT '[]'::jsonb,
  p_respondents jsonb DEFAULT '[]'::jsonb,
  p_ia_details jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_legalkart_case_id uuid;
  v_doc jsonb;
  v_obj jsonb;
  v_order jsonb;
  v_hist jsonb;
  v_petitioner jsonb;
  v_respondent jsonb;
  v_ia jsonb;
BEGIN
  -- Upsert main legalkart case record using cnr_number (correct column name)
  INSERT INTO public.legalkart_cases (
    cnr_number,
    firm_id,
    case_id,
    filing_date,
    filing_number,
    registration_date,
    registration_number,
    case_type,
    case_status,
    stage_of_case,
    next_hearing_date,
    coram,
    bench_type,
    judicial_branch,
    state,
    district,
    category,
    sub_category,
    petitioner_and_advocate,
    respondent_and_advocate,
    raw_api_response
  )
  VALUES (
    p_cnr_number,
    p_firm_id,
    p_case_id,
    (p_case_data->>'filing_date')::date,
    p_case_data->>'filing_number',
    (p_case_data->>'registration_date')::date,
    p_case_data->>'registration_number',
    p_case_data->>'case_type',
    p_case_data->>'case_status',
    p_case_data->>'stage_of_case',
    (p_case_data->>'next_hearing_date')::date,
    p_case_data->>'coram',
    p_case_data->>'bench_type',
    p_case_data->>'judicial_branch',
    p_case_data->>'state',
    p_case_data->>'district',
    p_case_data->>'category',
    p_case_data->>'sub_category',
    p_case_data->>'petitioner_and_advocate',
    p_case_data->>'respondent_and_advocate',
    p_case_data
  )
  ON CONFLICT (cnr_number)
  DO UPDATE SET
    firm_id = EXCLUDED.firm_id,
    case_id = COALESCE(EXCLUDED.case_id, legalkart_cases.case_id),
    filing_date = COALESCE(EXCLUDED.filing_date, legalkart_cases.filing_date),
    filing_number = COALESCE(EXCLUDED.filing_number, legalkart_cases.filing_number),
    registration_date = COALESCE(EXCLUDED.registration_date, legalkart_cases.registration_date),
    registration_number = COALESCE(EXCLUDED.registration_number, legalkart_cases.registration_number),
    case_type = COALESCE(EXCLUDED.case_type, legalkart_cases.case_type),
    case_status = COALESCE(EXCLUDED.case_status, legalkart_cases.case_status),
    stage_of_case = COALESCE(EXCLUDED.stage_of_case, legalkart_cases.stage_of_case),
    next_hearing_date = COALESCE(EXCLUDED.next_hearing_date, legalkart_cases.next_hearing_date),
    coram = COALESCE(EXCLUDED.coram, legalkart_cases.coram),
    bench_type = COALESCE(EXCLUDED.bench_type, legalkart_cases.bench_type),
    judicial_branch = COALESCE(EXCLUDED.judicial_branch, legalkart_cases.judicial_branch),
    state = COALESCE(EXCLUDED.state, legalkart_cases.state),
    district = COALESCE(EXCLUDED.district, legalkart_cases.district),
    category = COALESCE(EXCLUDED.category, legalkart_cases.category),
    sub_category = COALESCE(EXCLUDED.sub_category, legalkart_cases.sub_category),
    petitioner_and_advocate = COALESCE(EXCLUDED.petitioner_and_advocate, legalkart_cases.petitioner_and_advocate),
    respondent_and_advocate = COALESCE(EXCLUDED.respondent_and_advocate, legalkart_cases.respondent_and_advocate),
    raw_api_response = COALESCE(EXCLUDED.raw_api_response, legalkart_cases.raw_api_response),
    updated_at = now()
  RETURNING id INTO v_legalkart_case_id;

  -- Delete existing child records to replace with fresh data
  DELETE FROM public.legalkart_case_documents WHERE legalkart_case_id = v_legalkart_case_id;
  DELETE FROM public.legalkart_case_objections WHERE legalkart_case_id = v_legalkart_case_id;
  DELETE FROM public.legalkart_case_orders WHERE legalkart_case_id = v_legalkart_case_id;
  DELETE FROM public.legalkart_case_history WHERE legalkart_case_id = v_legalkart_case_id;
  DELETE FROM public.legalkart_petitioners WHERE legalkart_case_id = v_legalkart_case_id;
  DELETE FROM public.legalkart_respondents WHERE legalkart_case_id = v_legalkart_case_id;
  DELETE FROM public.legalkart_ia_details WHERE legalkart_case_id = v_legalkart_case_id;

  -- Insert documents
  FOR v_doc IN SELECT * FROM jsonb_array_elements(p_documents)
  LOOP
    INSERT INTO public.legalkart_case_documents (
      legalkart_case_id, document_filed, filed_by, filed_date, document_type, document_url
    ) VALUES (
      v_legalkart_case_id,
      v_doc->>'document_name',
      v_doc->>'filed_by',
      (v_doc->>'filed_date')::date,
      v_doc->>'document_type',
      v_doc->>'document_url'
    );
  END LOOP;

  -- Insert objections
  FOR v_obj IN SELECT * FROM jsonb_array_elements(p_objections)
  LOOP
    INSERT INTO public.legalkart_case_objections (
      legalkart_case_id, objection_date, objection_by, objection_status, objection_details
    ) VALUES (
      v_legalkart_case_id,
      (v_obj->>'objection_date')::date,
      v_obj->>'objection_by',
      v_obj->>'objection_status',
      v_obj->>'objection_details'
    );
  END LOOP;

  -- Insert orders
  FOR v_order IN SELECT * FROM jsonb_array_elements(p_orders)
  LOOP
    INSERT INTO public.legalkart_case_orders (
      legalkart_case_id, order_date, judge_name, order_summary, order_link
    ) VALUES (
      v_legalkart_case_id,
      (v_order->>'order_date')::date,
      v_order->>'judge_name',
      v_order->>'order_summary',
      v_order->>'order_link'
    );
  END LOOP;

  -- Insert history
  FOR v_hist IN SELECT * FROM jsonb_array_elements(p_history)
  LOOP
    INSERT INTO public.legalkart_case_history (
      legalkart_case_id, hearing_date, judge_name, purpose_of_hearing, business_on_date
    ) VALUES (
      v_legalkart_case_id,
      (v_hist->>'hearing_date')::date,
      v_hist->>'judge_name',
      v_hist->>'purpose',
      v_hist->>'business_on_date'
    );
  END LOOP;

  -- Insert petitioners
  FOR v_petitioner IN SELECT * FROM jsonb_array_elements(p_petitioners)
  LOOP
    INSERT INTO public.legalkart_petitioners (
      legalkart_case_id, petitioner_name, advocate_name
    ) VALUES (
      v_legalkart_case_id,
      v_petitioner->>'name',
      v_petitioner->>'advocate'
    );
  END LOOP;

  -- Insert respondents
  FOR v_respondent IN SELECT * FROM jsonb_array_elements(p_respondents)
  LOOP
    INSERT INTO public.legalkart_respondents (
      legalkart_case_id, respondent_name, advocate_name
    ) VALUES (
      v_legalkart_case_id,
      v_respondent->>'name',
      v_respondent->>'advocate'
    );
  END LOOP;

  -- Insert IA details
  FOR v_ia IN SELECT * FROM jsonb_array_elements(p_ia_details)
  LOOP
    INSERT INTO public.legalkart_ia_details (
      legalkart_case_id, ia_number, party, date_of_filing, next_date, ia_status
    ) VALUES (
      v_legalkart_case_id,
      v_ia->>'ia_number',
      v_ia->>'party',
      (v_ia->>'date_of_filing')::date,
      (v_ia->>'next_date')::date,
      v_ia->>'ia_status'
    );
  END LOOP;

  RETURN v_legalkart_case_id;
END;
$$;